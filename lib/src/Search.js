"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("globular-web-client/lib/api");
const Application_1 = require("./Application");
const Model_1 = require("./Model");
class Search {
    //
    constructor(paths, fields, query, offset) {
        api_1.searchDocuments(Model_1.Model.globular, paths, query, Application_1.Application.language, fields, offset, Search.pageSize, Search.snippetLenght, () => { }, () => { });
    }
}
