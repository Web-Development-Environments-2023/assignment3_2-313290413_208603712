const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");

/**
 * This function adds the user_id and recipe_id into the favorite_recipes DB
 */
async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into favorite_recipes (user_id, recipe_id) values ('${user_id}',${recipe_id})`);
}


/**
 * This function retrieves a list of all the recipe_id from the favorite_recipe DB that equals to the users who's requestin it
 */
async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from favorite_recipes where user_id='${user_id}'`);
    return recipes_id;
}

/**
 * This function retrieves a list of all the recipe_id from the my_recipe DB that equals to the users who's requestin it
 */
async function getMyRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from my_recipe where user_id='${user_id}'`);
    return recipes_id;
}

/**
 * This function adds the user_id and recipe_id to the my_recipe DB
 */
async function AddToMyRecipeDB(recipe_id, user_id) {
    await DButils.execQuery(`INSERT INTO my_recipe (user_id, recipe_id) VALUES ('${user_id}','${recipe_id}')`);
}


/**
 * This function adds the user_id and recipe_id to the last_seen_recipes DB
 */
async function getFamilyRecipeDB(recipe_id, user_id) {
    const recipes_id = await DButils.execQuery(`select recipe_id from family_recipe where user_id='${user_id}'`);
    return recipes_id;
}


/**
 * This function adds the user_id and recipe_id to the last_seen_recipes DB
 */
async function getLastSeen(user_id) {
    const recipes_id = await DButils.execQuery(`select recipe_id from last_seen_recipes where user_id='${user_id}'`);
    return recipes_id;}



exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;

exports.AddToMyRecipeDB = AddToMyRecipeDB;
exports.getLastSeen = getLastSeen;
exports.getMyRecipes = getMyRecipes;
exports.getFamilyRecipeDB = getFamilyRecipeDB;
