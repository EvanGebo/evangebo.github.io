import matplotlib.pyplot as plt
import numpy as np
import numpy.typing as npt
from scipy.optimize import approx_fprime
from matplotlib import rc


rc("text", usetex=True)

def sigmoid(x: npt.NDArray[np.float64]) -> npt.NDArray[np.float64]:
    return 1 / (1 + np.exp(-x))


def f(x: npt.NDArray[np.float64] | float) -> npt.NDArray[np.float64] | float:
    # return -np.exp(0.1 * x**2)
    x = -x
    x = x / 1.125 + 1
    return -0.75*x**4 - 0.2 * x**2


def f_grad(x: npt.NDArray[np.float64] | float) -> npt.NDArray[np.float64] | float:
    return approx_fprime(x, f, epsilon=1e-6)  # type: ignore


def f_hess(x: npt.NDArray[np.float64] | float) -> npt.NDArray[np.float64] | float:
    return approx_fprime(x, f_grad, epsilon=1e-6)  # type: ignore


def draw_trust_parabola(plt, x: npt.NDArray[np.float64], z: float, i: int, line_only: bool = False, label: bool = False) -> float:
    slope = f_grad(z)[0]  # type: ignore
    curvature = f_hess(z)[0]  # type: ignore
    v = z - slope / curvature
    
    taylor_approx = f(z) + slope * (x - z) + 0.5 * curvature * (x - z) ** 2
    taylor_approx = np.where(np.abs(x - z) <= np.abs(v - z), taylor_approx, np.nan)
    taylor_approx = np.where(x < z, taylor_approx - min(slope, 2) * (x - z), taylor_approx)
    
    if not line_only:
        lower = np.nanmin(taylor_approx) - 0.1
        plt.plot(x, taylor_approx, linestyle=":", color="grey")
        plt.fill_between(x, lower, taylor_approx, color="grey", alpha=0.3)
        plt.annotate(
            "", 
            xy=(v, lower), 
            xytext=(max(2 * z - v, -1), lower), 
            arrowprops=dict(arrowstyle="<->" if 2 * z - v > -1 else "->", color="black", lw=1.5)
        )
        plt.text(
            v - 0.05, lower + 0.5,
            r"$2\delta$", 
            horizontalalignment="center",
            verticalalignment="top",
            fontsize=12,
            color="black"
        )
        if label:
            tex = f"$\\widetilde\\mathcal{{L}}(\\pi, \\pi_{i}) + J(\\pi_{i})$"
            plt.text(
                z + 0.35, f(z) - 2.7, 
                tex, 
                horizontalalignment="center", 
                verticalalignment="top", 
                fontsize=12,
                color="black"
            )

    ymin = np.min(f(x))
    plt.plot([z, z], [ymin, f(z)], linestyle="--", color="firebrick")
    plt.text(
        z, ymin - 0.1, rf"$\pi_{i}$", 
        horizontalalignment="center", 
        verticalalignment="top", 
        fontsize=12,
        color="firebrick"
    )

    if not line_only:
        plt.scatter([v], [f(v)], color="firebrick", zorder=5)
        plt.scatter([z], [f(z)], color="firebrick", zorder=5)
        plt.scatter([v], [f(z) + slope * (v - z) + 0.5 * curvature * (v - z) ** 2], color="firebrick", zorder=5, marker="x")
    
    return z - slope / curvature


def draw_parabola(plt, x: npt.NDArray[np.float64], z: float, i: int, line_only: bool = False, label: bool = False) -> float:
    slope = f_grad(z)[0]
    curvature = f_hess(z)[0]
    taylor_approx = f(z) + slope * (x - z) + 0.5 * curvature * (x - z) ** 2
    taylor_approx = np.where(taylor_approx > f(z) - 0.5, taylor_approx, np.nan)
    if not line_only:
        plt.plot(x, taylor_approx, linestyle=":", color="grey")
        plt.fill_between(x, f(z) - 0.5, taylor_approx, color="grey", alpha=0.3)
        if label:
            tex = f"$\\widetilde\\mathcal{{L}}(\\pi, \\pi_{i}) + J(\\pi_{i}) - CD_{{\\mathrm{{KL}}}}^{{\\max}}(\\pi_{i} \\;\\|\\; \\pi)$"
            print(tex)
            plt.text(
                z + 0.35, f(z) + 0.25, 
                tex, 
                horizontalalignment="center", 
                verticalalignment="top", 
                fontsize=12,
                color="black"
            )

    ymin = np.min(f(x))
    plt.plot([z, z], [ymin, f(z)], linestyle="--", color="firebrick")
    plt.text(
        z, ymin - 0.1, rf"$\pi_{i}$", 
        horizontalalignment="center", 
        verticalalignment="top", 
        fontsize=12,
        color="firebrick"
    )

    v = z - slope / curvature
    if not line_only:
        plt.scatter([v], [f(v)], color="firebrick", zorder=5)
        plt.scatter([z], [f(z)], color="firebrick", zorder=5)
        plt.scatter([v], [f(z) + slope * (v - z) + 0.5 * curvature * (v - z) ** 2], color="firebrick", zorder=5, marker="x")
    
    return z - slope / curvature


if __name__ == "__main__":
    for name, plotter in [("penalized", draw_parabola), ("constrained", draw_trust_parabola)]:
        plt.figure(figsize=(8, 4))
        
        x = np.linspace(-1, 1, 100)
        y = f(x)
        plt.plot(x, y, linewidth=2, zorder=4, color="navy")

        if name == "penalized":
            plt.text(
                0.31, 0.75, 
                r"$J(\pi)$", 
                transform=plt.gca().transAxes, 
                fontsize=16,
                color="navy",
                horizontalalignment="center", 
                verticalalignment="center",
            )
        else:
            plt.text(
                0.95, 0.96, 
                r"$J(\pi)$", 
                transform=plt.gca().transAxes, 
                fontsize=16,
                color="navy",
                horizontalalignment="center", 
                verticalalignment="center",
            )

        plt.grid(False)
        plt.tick_params(left=False, bottom=False, labelleft=False, labelbottom=False)
        plt.gca().spines["top"].set_visible(False)
        plt.gca().spines["right"].set_visible(False)
        plt.xlim(x.min(), x.max())
        ylim = (np.min(y), np.max(y))
        plt.ylim(ylim[0], ylim[1] + 0.1 * (ylim[1] - ylim[0]))

        z1 = -0.75
        z2 = plotter(plt, x, z=z1, i=1, label=True)
        z3 = plotter(plt, x, z=z2, i=2)
        z4 = plotter(plt, x, z=z3, i=3)
        z5 = plotter(plt, x, z=z4, i=4, line_only=True)

        plt.ylabel("Reward Space")
        plt.xlabel("Policy Space", labelpad=20)
        
        plt.tight_layout()
        plt.savefig(f"{name}.svg", bbox_inches="tight")
        # plt.show()
