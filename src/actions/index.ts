import {
    findEntity,
    findEntityByTMDBId,
    searchMedia,
} from './media';
import {
    createMoment,
    createReview,
    getMoment,
    updateMoment,
} from './content';
import { createPlace, searchPOI } from './places';

export const server = {
    searchMedia,
    findEntityByTMDBId,
    findEntity,
    createMoment,
    createReview,
    getMoment,
    updateMoment,
    createPlace,
    searchPOI,
};
