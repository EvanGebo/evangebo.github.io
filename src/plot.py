import numpy as np
import numpy.typing as npt

import matplotlib
import matplotlib.pyplot as plt
from matplotlib.axes import Axes
from matplotlib.patches import Polygon
from matplotlib.colors import Normalize
from matplotlib import colormaps
from scipy.spatial import Delaunay
from scipy.interpolate import griddata


type Array = npt.NDArray[np.float64]
type Policy = tuple[float, float, float]


EPS = 1e-12


matplotlib.use("Qt5Agg")
plt.style.use("ggplot")
plt.rcParams.update({
    "text.usetex": True,
    "font.family": "serif",
    "text.latex.preamble": r"\usepackage{amsmath}"
})


def softmax(z: Array) -> Array:
    z = np.asarray(z)
    exp_z = np.exp(z - z.max(axis=-1, keepdims=True))
    return exp_z / exp_z.sum(axis=-1, keepdims=True)


def is_valid(policy: Policy) -> bool:
    return all(0 <= p <= 1 for p in policy) and abs(sum(policy) - 1) < 1e-6


def draw_triangle(ax: Axes):
    vertices = np.array([
        [0, 0],
        [1, 0],
        [0, 1]
    ])
    triangle = Polygon(vertices, closed=True, edgecolor="black", facecolor="none", linewidth=2)
    ax.add_patch(triangle)


def kl_divergence(p1: Policy | Array, p2: Policy | Array) -> Array:
    p1 = np.atleast_2d(np.asarray(p1))
    p2 = np.atleast_2d(np.asarray(p2))
    assert p1.shape[1] == p2.shape[1]

    safe_p1 = np.where(p1 != 0, p1, 1)
    safe_p2 = np.where(p2 != 0, p2, 1)
    logs = np.where(
        p1 != 0,
        np.where(
            p2 != 0,
            safe_p1 * (np.log(safe_p1) - np.log(safe_p2)),
            np.inf,
        ),
        0,
    )

    return np.sum(logs, axis=1)

if __name__ == "__main__":
    fig, ax = plt.subplots()
    ax.set_aspect("equal")

    policy = (3/5, 1/5,1/5)
    plt.scatter(policy[0], policy[1], color="red", s=100)

    # Generate a grid of points over the triangle
    num_points = 30
    p1 = np.linspace(0, 1, num_points)
    p2 = np.linspace(0, 1, num_points)
    grid_points = []

    for x in p1:
        for y in p2:
            if x + y <= 1:
                grid_points.append((x, y))

    grid_points = np.array(grid_points)
    grid_points = np.column_stack((grid_points, 1 - grid_points[:, 0] - grid_points[:, 1]))

    kl = kl_divergence(grid_points, policy)
    mask = ~np.isnan(kl)
    kl = kl[mask]
    grid_points = grid_points[mask]

    norm = Normalize(vmin=np.min(kl), vmax=np.max(kl))
    colors = colormaps["viridis"](norm(kl))

    # Use pcolormesh to create a continuous colormap over the triangle

    # Triangulate the grid points within the simplex
    tri = Delaunay(grid_points[:, :2])
    tpc = ax.tripcolor(
        grid_points[:, 0], grid_points[:, 1], tri.simplices, kl,
        cmap='viridis', shading='gouraud', edgecolors='none', norm=norm
    )
    # Draw a single contour for a level set of the KL divergence

    # Create a dense grid for contouring
    resolution = 200
    Xi, Yi = np.meshgrid(np.linspace(0, 1, resolution), np.linspace(0, 1, resolution))
    mask = Xi + Yi <= 1
    Zi = np.full_like(Xi, np.nan, dtype=float)

    # Interpolate KL values onto the grid
    Zi[mask] = griddata(
        grid_points[:, :2], kl, (Xi[mask], Yi[mask]), method='linear'
    )

    # Choose a contour level (e.g., median KL value)
    level = np.percentile(kl, 25)
    contour = ax.contour(
        Xi, Yi, Zi, levels=[level], colors='black', linewidths=2, linestyles='dashed'
    )
    draw_triangle(ax)

    plt.scatter(policy[0], policy[1], color="red", s=100)

    # Add a colorbar
    sm = plt.cm.ScalarMappable(cmap='viridis', norm=norm)
    sm.set_array([])
    plt.colorbar(sm, ax=ax, label="KL Divergence")

    grid_points = np.array(grid_points)
    
    ax.set_xlabel("$p_1$")
    ax.set_ylabel("$p_2$")
    ax.set_xlim(-0.1, 1.1)
    ax.set_ylim(-0.1, 1.1)
    ax.set_title(r"Probability simplex for policy $\pi = (p_1, p_2, 1 - p_1 - p_2)$")
    plt.show()
