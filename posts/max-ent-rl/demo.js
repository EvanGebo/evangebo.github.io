{
const DIV = "#div-demo";

const grid = parse_map_string(`
S........A
S........A
S........A
`);

const R_STEP = -0.01;
const R_BUMP = -0.02;
const R_GOAL = +1.00;

mdp = {
    actions: Actions,
    states: grid.flatMap((row, y) =>
        row.map((tile, x) => (tile !== '#') ? {x: x, y: y} : null).filter(Boolean)
    ),
    gamma: 0.99,
    P: (s_old, a) => {
        if (is_terminal(grid, s_old)) return [{s: s_old, p: 1, r: 0}];

        const s_new = {x: s_old.x + a.d.x, y: s_old.y + a.d.y};
        if (is_wall(grid, s_new)) return [{s: s_old, p: 1, r: R_BUMP}];

        const t_new = grid[s_new.y][s_new.x];
        if (t_new === "A") return [{s: s_new, p: 1, r: R_GOAL}];
        return [{s: s_new, p: 1, r: R_STEP}];
    },
    initial_state: [
        {s: {x: 0, y: 0}, r: 0, p: 1},
        {s: {x: 1, y: 0}, r: 0, p: 1},
        {s: {x: 2, y: 0}, r: 0, p: 1}
    ]
};

const grid_h = grid.length;
const grid_w = grid[0].length;

const { svg, w, h, mh, mt, mb } = UTILS.getSVG(DIV, 100 * grid_h / grid_w, 1, 1, false);

const cell_size = w / grid_w;

draw_gridworld(svg, grid, cell_size);
}
