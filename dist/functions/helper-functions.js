"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandlePhoneNumber = HandlePhoneNumber;
function HandlePhoneNumber(str) {
    const checkfirstFive = str.slice(0, 5);
    if (checkfirstFive[4] === '0') {
        return str.slice(0, 4) + str.slice(5);
    }
    return str.replace(/[\s-]/g, '');
}
//# sourceMappingURL=helper-functions.js.map