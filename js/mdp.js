function softmax(zs, alpha = 1) {
    const exps = zs.map(x => Math.exp((x - Math.max(...zs)) / alpha));
    return exps.map(e => e / exps.reduce((a, b) => a + b, 0));
}

function sample(distribution) {
    if (distribution.length === 1) return { s: distribution[0].s, r: distribution[0].r };
    console.assert(distribution.length > 1);
    console.assert(distribution.every(({ p }) => p >= 0));

    const total = distribution.reduce((sum, { p }) => sum + p, 0);
    const threshold = Math.random() * total;
    console.assert(total > 0);

    let cumulative = 0;
    for (const { s, p, r } of distribution) {
        cumulative += p;
        if (cumulative >= threshold) return { s, r };
    }
    return distribution[distribution.length - 1];
}

function rollout(grid, policy, { gamma, P, initial_state }, max_length) {
    let {s, G} = sample(initial_state);
    const trajectory = [s];

    for (let t = 1; t < max_length; t++) {
        if (is_terminal(grid, s)) break;

        const a = policy(s);
        const {s: s_new, r: r_new} = sample(P(s, a));
        trajectory.push(s_new);
        s = s_new;
        G += (gamma**t) * r_new;
    }

    return { trajectory, return: G };
}

function initialize_Q(actions, states, value = null) {
    return Array(states.length).fill(null).map(() => Array(actions.length).fill(value));
}

function Q_iteration({ actions, states, gamma, P }, R_max = 0, max_iterations = 1000, tolerance = 1e-6) {
    let Qs = [initialize_Q(actions, states, R_max  / ( 1 - gamma))];
    let errors = [null];

    for (let it = 0; it < max_iterations; it++) {
        let error = 0;
        const Q = initialize_Q(actions, states, 0);
        for (let i = 0; i < states.length; i++) {
            const s = states[i];
            for (let j = 0; j < actions.length; j++) {
                const a = actions[j];
                for (const { s_new, p, r } of P(s, a)) {
                    const k = states.findIndex(s2 => s2.x === s_new.x && s2.y === s_new.y);
                    Q[i][j] += p * (r + gamma * Math.max(...Qs[it][k]));
                }
                error = Math.max(error, Math.abs(Q[i][j] - Qs[it][i][j]));
            }
        }
        errors.push(error);
        Qs.push(Q);
        if (error < tolerance) {
            break;
        }
    }

    const iterations = Qs.length - 1;
    return { Q: Qs[iterations], error: errors[iterations], iterations: iterations };
}

function soft_Q_iteration({ actions, states, gamma, p, r }, alpha = 1, R_max = 0, max_iterations = 1000, tolerance = 1e-6) {
    let Qs = [initialize_Q(actions, states, R_max)];
    let errors = [null];
}
