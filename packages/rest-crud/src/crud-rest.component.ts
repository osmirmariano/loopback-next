// Copyright IBM Corp. 2020. All Rights Reserved.
// Node module: @loopback/rest-crud
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Component, createBindingFromClass} from '@loopback/core';
import {CrudRestApiBuilder} from './crud-rest.api-builder';

export class CrudRestComponent implements Component {
  bindings = [createBindingFromClass(CrudRestApiBuilder)];
}
