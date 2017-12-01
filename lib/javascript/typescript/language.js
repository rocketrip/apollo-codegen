"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const t = require("@babel/types");
class TypescriptGenerator {
    constructor(compilerOptions) {
        this.options = compilerOptions;
        this.typeAnnotationFromGraphQLType = helpers_1.createTypeAnnotationFromGraphQLTypeFunction(compilerOptions);
    }
    enumerationDeclaration(type) {
        const { name, description } = type;
        const enumMembers = type.getValues().map(({ value }) => {
            return t.tSEnumMember(t.identifier(value), t.stringLiteral(value));
        });
        const typeAlias = t.exportNamedDeclaration(t.tSEnumDeclaration(t.identifier(name), enumMembers), []);
        typeAlias.leadingComments = [{
                type: 'CommentLine',
                value: ` ${description}`
            }];
        return typeAlias;
    }
    inputObjectDeclaration(inputObjectType) {
        const { name, description } = inputObjectType;
        const fieldMap = inputObjectType.getFields();
        const fields = Object.keys(inputObjectType.getFields())
            .map((fieldName) => {
            const field = fieldMap[fieldName];
            return {
                name: fieldName,
                annotation: this.typeAnnotationFromGraphQLType(field.type)
            };
        });
        const typeAlias = this.typeAliasObject(name, fields, {
            keyInheritsNullability: true
        });
        typeAlias.leadingComments = [{
                type: 'CommentLine',
                value: ` ${description}`
            }];
        return typeAlias;
    }
    objectTypeAnnotation(fields, { keyInheritsNullability = false } = {}) {
        const objectTypeAnnotation = t.objectTypeAnnotation(fields.map(({ name, description, annotation }) => {
            const objectTypeProperty = t.objectTypeProperty(t.identifier((keyInheritsNullability && annotation.type === "NullableTypeAnnotation")
                ? name + '?'
                : name), annotation.type === "NullableTypeAnnotation"
                ? this.makeNullableAnnotation(annotation.typeAnnotation)
                : annotation);
            if (description) {
                objectTypeProperty.trailingComments = [{
                        type: 'CommentLine',
                        value: ` ${description}`
                    }];
            }
            return objectTypeProperty;
        }));
        return objectTypeAnnotation;
    }
    typeAliasObject(name, fields, { keyInheritsNullability = false } = {}) {
        return t.typeAlias(t.identifier(name), undefined, this.objectTypeAnnotation(fields, {
            keyInheritsNullability
        }));
    }
    typeAliasObjectUnion(name, members) {
        return t.typeAlias(t.identifier(name), undefined, t.unionTypeAnnotation(members.map(member => {
            return this.objectTypeAnnotation(member);
        })));
    }
    typeAliasGenericUnion(name, members) {
        return t.typeAlias(t.identifier(name), undefined, t.unionTypeAnnotation(members));
    }
    exportDeclaration(declaration) {
        return t.exportNamedDeclaration(declaration, []);
    }
    annotationFromScopeStack(scope) {
        return t.genericTypeAnnotation(t.identifier(scope.join('_')));
    }
    makeNullableAnnotation(annotation) {
        return t.unionTypeAnnotation([
            annotation,
            t.tSUndefinedKeyword(),
            t.tSNullKeyword()
        ]);
    }
}
exports.default = TypescriptGenerator;
//# sourceMappingURL=language.js.map