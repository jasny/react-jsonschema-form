import get from 'lodash/get';

import { ALL_OF_KEY, DEPENDENCIES_KEY, ID_KEY, ITEMS_KEY, PROPERTIES_KEY, REF_KEY } from '../constants';
import {
  Experimental_CustomMergeAllOf,
  FormContextType,
  GenericObjectType,
  IdSchema,
  RJSFSchema,
  StrictRJSFSchema,
  ValidatorType,
} from '../types';
import retrieveSchema from './retrieveSchema';
import getSchemaType from '../getSchemaType';
import deepEquals from '../deepEquals';

/** An internal helper that generates an `IdSchema` object for the `schema`, recursively with protection against
 * infinite recursion
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the `IdSchema` is desired
 * @param idPrefix - The prefix to use for the id
 * @param idSeparator - The separator to use for the path segments in the id
 * @param [id] - The base id for the schema
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [_recurseList=[]] - The list of retrieved schemas currently being recursed, used to prevent infinite recursion
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - The `IdSchema` object for the `schema`
 */
function toIdSchemaInternal<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  idPrefix: string,
  idSeparator: string,
  id?: string | null,
  rootSchema?: S,
  formData?: T,
  _recurseList: S[] = [],
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): IdSchema<T> {
  const $id = id || idPrefix;
  const idSchema: IdSchema<T> = { $id } as IdSchema<T>;
  if (typeof schema === 'object') {
    if (REF_KEY in schema || DEPENDENCIES_KEY in schema || ALL_OF_KEY in schema) {
      const _schema = retrieveSchema<T, S, F>(validator, schema, rootSchema, formData, experimental_customMergeAllOf);
      const sameSchemaIndex = _recurseList.findIndex((item) => deepEquals(item, _schema));
      if (sameSchemaIndex === -1) {
        return toIdSchemaInternal<T, S, F>(
          validator,
          _schema,
          idPrefix,
          idSeparator,
          id,
          rootSchema,
          formData,
          _recurseList.concat(_schema),
          experimental_customMergeAllOf,
        );
      }
    }
    if (ITEMS_KEY in schema && !get(schema, [ITEMS_KEY, REF_KEY])) {
      return toIdSchemaInternal<T, S, F>(
        validator,
        get(schema, ITEMS_KEY) as S,
        idPrefix,
        idSeparator,
        id,
        rootSchema,
        formData,
        _recurseList,
        experimental_customMergeAllOf,
      );
    }
    if (getSchemaType<S>(schema) === 'object' && PROPERTIES_KEY in schema) {
      for (const name in schema.properties) {
        const field: S = schema[PROPERTIES_KEY][name] as S;
        const fieldId = idSchema[ID_KEY] + idSeparator + name;
        (idSchema as IdSchema<GenericObjectType>)[name] = toIdSchemaInternal<T, S, F>(
          validator,
          field,
          idPrefix,
          idSeparator,
          fieldId,
          rootSchema,
          // It's possible that formData is not an object -- this can happen if an
          // array item has just been added, but not populated with data yet
          get(formData, [name]),
          _recurseList,
          experimental_customMergeAllOf,
        );
      }
    }
  }
  return idSchema;
}

/** Generates an `IdSchema` object for the `schema`, recursively
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the `IdSchema` is desired
 * @param [id] - The base id for the schema
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [formData] - The current formData, if any, to assist retrieving a schema
 * @param [idPrefix='root'] - The prefix to use for the id
 * @param [idSeparator='_'] - The separator to use for the path segments in the id
 * @param [experimental_customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - The `IdSchema` object for the `schema`
 */
export default function toIdSchema<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  id?: string | null,
  rootSchema?: S,
  formData?: T,
  idPrefix = 'root',
  idSeparator = '_',
  experimental_customMergeAllOf?: Experimental_CustomMergeAllOf<S>,
): IdSchema<T> {
  return toIdSchemaInternal<T, S, F>(
    validator,
    schema,
    idPrefix,
    idSeparator,
    id,
    rootSchema,
    formData,
    undefined,
    experimental_customMergeAllOf,
  );
}
