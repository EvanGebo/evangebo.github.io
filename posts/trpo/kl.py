from collections.abc import Callable
from functools import partial

import matplotlib.pyplot as plt
import numpy as np
import numpy.typing as npt
from matplotlib import rc
from matplotlib.colors import Normalize
from scipy.optimize import approx_fprime
from scipy.interpolate import RegularGridInterpolator
from mpl_toolkits.mplot3d import proj3d
from matplotlib.patches import Circle

rc("text", usetex=True)
plt.rcParams.update({"font.size": 14})

type Array = npt.NDArray[np.float64]


def sigmoid(z: Array) -> Array:
    return 1 / (1 + np.exp(-z))


def kl_divergence(old_policy: Array, policies: Array) -> Array:
    policies = np.atleast_2d(policies)
    old_policy = np.atleast_1d(old_policy)
    assert old_policy.ndim == 1
    assert old_policy.shape[0] >= 2
    assert policies.shape[-1] == old_policy.shape[0]

    return np.sum(policies * np.log(policies / old_policy), axis=-1)


def bernoulli_policy(X: Array, Y: Array, logit: Callable[[Array, Array], Array], temperature: float = 1) -> Array:
    assert temperature > 0
    p = sigmoid(logit(X, Y) / temperature)
    return np.stack([p, 1 - p], axis=-1)


def bernoulli_policy_hessian(x: float, y: float, logit: Callable[[Array, Array], Array], temperature: float = 1) -> Array:
    scalar = np.prod(bernoulli_policy(x, y, logit, temperature)) / temperature**2  # type: ignore
    g = approx_fprime(np.array([x, y]), lambda X: logit(X[0], X[1]))
    return scalar * np.outer(g, g)  # type: ignore


def inverse(H: Array) -> Array:
    assert H.shape == (2, 2)
    return np.matrix([
        [H[1, 1], -H[1, 0]],
        [-H[0, 1], H[0, 0]],
    ]) / (H[0, 0] * H[1, 1] - H[0, 1] * H[1, 0])


def logit_saddle(X: Array, Y: Array, alpha: float = 1, beta: float = 1, b: float = 0) -> Array:
    return X**2 - Y**2 + alpha * X + beta * Y + b


def logit_polar(X: Array, Y: Array, m: float = 3, l: float = 0.5, eta: float = 0.5) -> Array:
    r = np.sqrt(X**2 + Y**2)
    theta = np.atan2(Y, X)
    return eta * np.sin(m * theta) - l * r**2


def logit_xor(X: Array, Y: Array) -> Array:
    return X * Y + X + Y


def logit_cubic(X: Array, Y: Array) -> Array:
    return X**3 - 3 * X * Y + 0.5 * (X + Y)


def logit_exponential(X: Array, Y: Array) -> Array:
    return 2 * np.exp(X) - 3 * Y - np.exp(1) - 0.5


if __name__ == "__main__":
    resolution = 1_000
    center = np.array([1.15, 1])
    # logit = logit_exponential
    logit = partial(logit_saddle, alpha=-2.2, beta=1.7, b=0)

    x = np.linspace(0, 2, resolution)
    y = np.linspace(0, 2, resolution)
    X, Y = np.meshgrid(x, y)

    policies = bernoulli_policy(X, Y, logit)
    old_policy = bernoulli_policy(center[0], center[1], logit)
    Z = kl_divergence(old_policy, policies)
    
    H = bernoulli_policy_hessian(center[0], center[1], logit)
    H += np.eye(2) * 10**(-1.25)

    def quadratic_approximation(X: Array, Y: Array) -> Array:
        dx = X - center[0]
        dy = Y - center[1]
        return H[0, 0] * dx**2 + (H[0, 1] + H[1, 0]) * dx * dy + H[1, 1] * dy**2

    Q = quadratic_approximation(X, Y)

    def plot_3d():
        interp = RegularGridInterpolator((y, x), Z)
        
        center = np.array([0.65, 1.25])
        kl_center = interp(center)[0]

        fig = plt.figure(figsize=(16, 8))
        ax = fig.add_subplot(111, projection="3d")
        ax.margins(0)

        ax.grid(False)
        for axis in (ax.xaxis, ax.yaxis, ax.zaxis):
            axis.set_ticks([])
            axis.label.set_visible(False)
            axis.pane.set_visible(False)  # type: ignore
            axis.line.set_color((1, 1, 1, 0))  # type: ignore
        
        ax.plot_surface(
            X,
            Y,
            Z,
            cmap="cividis",
            edgecolor="none",
            alpha=0.9,
            rcount=1000,
            linewidth=0,
            antialiased=False,
        )
        
        fig.canvas.draw()
        x2, y2, _ = proj3d.proj_transform(center[0], center[1], kl_center, ax.get_proj())
        x_disp, y_disp = ax.transData.transform((x2, y2))
        x_fig, y_fig = fig.transFigure.inverted().transform((x_disp, y_disp))

        overlay_radius = 0.0025  # tune size (fraction of figure)
        marker = plt.Circle((x_fig, y_fig), overlay_radius, transform=fig.transFigure, color="white", zorder=1000)
        fig.patches.append(marker)

        u = np.linspace(0, 2 * np.pi, 100)
        circle_x = center[0] + 0.4 * np.cos(u)
        circle_y = center[1] + 0.4 * np.sin(u)
        circle_z = interp(np.stack([circle_y, circle_x], axis=-1))
        ax.plot(circle_x, circle_y, circle_z, color="white", linestyle="--", linewidth=2, zorder=10)

        fig.subplots_adjust(0,0,1,1)
        plt.tight_layout()
        plt.savefig(
            "kl_divergence_3d.png",
            bbox_inches="tight",
            format="png",
            dpi=800,
            pad_inches=0,
        )

    def plot_2d():
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 5), sharey=True, sharex=True)

        cmap = "bone_r"
        norm = Normalize(vmin=0, vmax=1)

        pcm1 = ax1.pcolormesh(X, Y, policies[:, :, 0], cmap=cmap, shading="auto", norm=norm)
        pcm1.set_rasterized(True)
        # fig.colorbar(pcm1, ax=ax1, orientation="vertical")
        ax1.set_title(r"$\pi(a = a_1 \mid s)$")

        pcm2 = ax2.pcolormesh(X, Y, Z, cmap=cmap, shading="auto", norm=norm)
        pcm2.set_rasterized(True)
        fig.colorbar(pcm2, ax=ax2, orientation="vertical")
        ax2.set_title(r"$\overline D_\mathrm{KL}\big( \pi_\mathrm{old} \;\|\; \pi \big)$")

        ax1.set_ylabel(r"$y$")
        for ax in (ax1, ax2):
            ax.scatter(center[0], center[1], color="black", edgecolor="white", label=r"$\pi_\mathrm{old}$")
            ax.contour(X, Y, Z, levels=[0.05], colors="#FFC107", linewidths=2)
            ax.scatter(center[0], center[1], facecolor="none", edgecolor="#D81B60", s=4000, linestyle="--", linewidth=2)
            ax.contour(X, Y, Q, levels=[0.05], colors="#D55E00", linestyles=":", linewidths=3)
            
            ax.set_aspect("equal")
            ax.set_xlabel(r"$x$")
            ax.set_xticks([0, 1, 2])
            ax.set_yticks([0, 1, 2])
            ax.plot(0, 0, color="#FFC107", linestyle="-", label=r"$\overline D_\mathrm{KL}(\pi_\mathrm{old} \;\|\; \pi) \leq \delta$")
            ax.plot(0, 0, color="#D55E00", linestyle=":", label=r"$\frac{1}{2}(\theta - \theta_\mathrm{old})^\top \mathbf{H} (\theta - \theta_\mathrm{old}) \leq \delta$")
            ax.plot(0, 0, color="#D81B60", linestyle="--", label=r"$\frac{1}{2}\|\theta - \theta_\mathrm{old}\|^2 \leq \delta$")
            legend = ax.legend(loc="upper left")
            legend.get_frame().set_facecolor([0.1, 0.1, 0.1])
            legend.get_frame().set_alpha(0.8)
            for text in legend.get_texts():
                text.set_fontsize(11)
                text.set_color("#ffffff")
            for text, line in zip(legend.get_texts()[1:], legend.get_lines()):
                text.set_color(line.get_color())
        
        plt.tight_layout()
        plt.savefig("kl_divergence_contour.svg", format="svg")

    plot_3d()
