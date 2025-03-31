export function isLocalEnv() : boolean {
    return process.env.NODE_ENV.includes('local')
}

export function isUsingLocalNetwork() : boolean {
    return process.env.NODE_ENV.includes('ali-local')
}
