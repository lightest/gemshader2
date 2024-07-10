function traceRegistration(name: string): void {
    console.log(`Registering polyfill for '${name}'.`);
}

function registerStringStartsWithPolyfill(): void {
    if (typeof String.prototype.startsWith !== "function") {
        traceRegistration("String.startsWith");
        String.prototype.startsWith = function (tested: string): boolean {
            return this.indexOf(tested) === 0;
        };
    }
}

function registerPolyfills(): void {
    registerStringStartsWithPolyfill();
}

export {
    registerPolyfills,
};
