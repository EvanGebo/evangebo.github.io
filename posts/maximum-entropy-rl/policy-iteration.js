

function initialize_Q(actions, states, value = null) {
    return Array(states.length).fill(null).map(() => Array(actions.length).fill(value));
}

function softmax(zs, alpha) {
    const exps = zs.map(x => Math.exp((x - Math.max(...zs)) / alpha));
    return exps.map(e => e / exps.reduce((a, b) => a + b, 0));
}

function Q_iteration({ actions, states, gamma, p, r }, R_max = 0, max_iterations = 1000, tolerance = 1e-6) {
    let Qs = [initialize_Q(actions, states, R_max)];
    let errors = [null];

    for (let it = 0; it < max_iterations; it++) {
        let error = 0;
        const Q = initialize_Q(actions, states, 0);
        for (let i = 0; i < states.length; i++) {
            const s = states[i];
            for (let j = 0; j < actions.length; j++) {
                const a = actions[j];
                for (let k = 0; k < states.length; k++) {
                    Q[i][j] += p(states[k], s, a) * (r(s, a, states[k]) + gamma * Math.max(...Qs[it][k]));
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
