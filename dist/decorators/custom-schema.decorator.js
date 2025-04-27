"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomSchema = CustomSchema;
const mongoose_1 = require("@nestjs/mongoose");
function CustomSchema(options = {}) {
    return (0, mongoose_1.Schema)({
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (_, ret) => {
                ret.id = ret._id;
                delete ret._id;
            },
        },
        ...options,
    });
}
//# sourceMappingURL=custom-schema.decorator.js.map