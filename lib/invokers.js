"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns a function that when called with a name,
 * returns another function to be used as Koa middleware.
 * That function will run `fn` with the container cradle as the
 * only parameter, and then call the `methodToInvoke` on
 * the result.
 *
 * @param, {Function} fn
 * @return {(methodToInvoke: string) => (ctx) => void}
 */
function makeInvoker(fn) {
    /**
     * 2nd step is to create a method to invoke on the result
     * of the function.
     *
     * @param  {string} methodToInvoke
     * @return {(ctx) => void}
     */
    return function makeMemberInvoker(methodToInvoke) {
        /**
         * The invoker middleware.
         *
         * @param  {Koa.Context} ctx
         * @param  {...*} rest
         * @return {*}
         */
        return function memberInvoker(ctx) {
            var rest = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                rest[_i - 1] = arguments[_i];
            }
            var result = fn(ctx.state.container.cradle);
            return result[methodToInvoke].apply(result, [ctx].concat(rest));
        };
    };
}
exports.makeInvoker = makeInvoker;
/**
 * Same as `makeInvoker` but for classes.
 *
 * @param  {Class} Class
 * @return {(methodToInvoke: string) => (ctx) => void}
 */
function makeClassInvoker(Class) {
    return makeInvoker(function (cradle) { return new Class(cradle); });
}
exports.makeClassInvoker = makeClassInvoker;
//# sourceMappingURL=invokers.js.map