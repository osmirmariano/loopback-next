// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/rest-crud
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {bind, ControllerClass, inject} from '@loopback/core';
import {
  asModelApiBuilder,
  ModelApiBuilder,
  ModelApiConfig,
} from '@loopback/model-api-builder';
import {
  ApplicationWithRepositories,
  Class,
  Entity,
  EntityCrudRepository,
} from '@loopback/repository';
import {Model} from '@loopback/rest';
import debugFactory from 'debug';
import {defineCrudRepositoryClass, defineCrudRestController} from '.';

const debug = debugFactory('loopback:boot:crud-rest');

export interface ModelCrudRestApiConfig extends ModelApiConfig {
  // E.g. '/products'
  basePath: string;
}

@bind(asModelApiBuilder)
export class CrudRestApiBuilder implements ModelApiBuilder {
  readonly pattern: string = 'CrudRest';

  build(
    application: ApplicationWithRepositories,
    modelClass: typeof Model & {prototype: Model},
    cfg: ModelApiConfig,
  ): Promise<void> {
    const modelName = modelClass.name;
    const config = cfg as ModelCrudRestApiConfig;
    if (!config.basePath) {
      throw new Error(
        `Missing required field "basePath" in configuration for model ${modelName}.`,
      );
    }

    if (!(modelClass.prototype instanceof Entity)) {
      throw new Error(
        `CrudRestController requires an Entity, Models are not supported. (Model name: ${modelName})`,
      );
    }
    const entityClass = modelClass as typeof Entity & {prototype: Entity};

    let repoClassName = entityClass.name + 'Repository';

    try {
      application.getBinding('repositories.' + repoClassName);
      debug(
        'Using repository class',
        repoClassName,
        ', as it is already bound to application',
      );
    } catch {
      // repository class does not exist
      const repositoryClass = setupCrudRepository(entityClass, config);
      application.repository(repositoryClass);
      repoClassName = repositoryClass.name;
      debug('Registered repository class', repoClassName);
    }

    const controllerClass = setupCrudRestController(entityClass, config);
    application.controller(controllerClass);
    debug('Registered controller class', controllerClass.name);

    return Promise.resolve();
  }
}

/**
 * Set up a CRUD Repository class for the given Entity class.
 *
 * @param entityClass - the Entity class the repository is built for
 * @param modelConfig - configuration of the Entity class
 */
function setupCrudRepository(
  entityClass: typeof Entity & {prototype: Entity},
  modelConfig: ModelCrudRestApiConfig,
): Class<EntityCrudRepository<Entity, unknown>> {
  const repositoryClass = defineCrudRepositoryClass(entityClass);

  inject(`datasources.${modelConfig.dataSource}`)(
    repositoryClass,
    undefined,
    0,
  );

  return repositoryClass;
}

/**
 * Set up a CRUD Controller class for the given Entity class.
 *
 * @param entityClass - the Entity class the controller is built for
 * @param modelConfig - configuration of the Entity class
 */
function setupCrudRestController(
  entityClass: typeof Entity & {prototype: Entity},
  modelConfig: ModelCrudRestApiConfig,
): ControllerClass {
  const controllerClass = defineCrudRestController(
    entityClass,
    // important - forward the entire config object to allow controller
    // factories to accept additional (custom) config options
    modelConfig,
  );

  inject(`repositories.${entityClass.name}Repository`)(
    controllerClass,
    undefined,
    0,
  );

  return controllerClass;
}
