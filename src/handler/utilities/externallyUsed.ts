/**
 * This function denotes usage of decorated method is external
 * Also, makes method appear 'used' in IDEs
 * @param _target
 * @param _propertyKey
 * @param _descriptor
 * @constructor
 */
export function ExternallyUsed(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _target: unknown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _propertyKey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _descriptor: PropertyDescriptor,
) {
    return void 0;
}
