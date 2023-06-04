const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const search = "complexSearch";
const ingredientsByID = "ingredientWidget.json";
const instructions = "analyzedInstructions";
const DButils = require("./DButils");



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */
async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}


/**
 * Get recipe information about necessery to save in DB
 */
async function getRecipeDetails(recipe_id, user_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree, servings } = recipe_info.data;
    let already_watched = await didWatch(recipe_id, user_id);
    let favorite = await IsInFavorite(recipe_id, user_id);

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,

        // thing I added:
        servings: servings,
        already_watched_indicator: already_watched,
        favorite_indicator: favorite

        // Missing: servings, already_watched_indicator, saved_to_favorites_indicator
    }
}

/**
 * returns a list of all information about all the recipe_ids recieved as an argument
 */
async function getRecipesPreview(recipes_id_array, user_id) {
    let array_of_recipes_preview = [];
    // return recipes_id_array.map((element) => array_of_recipes_preview.push(element.recipe_id)); //extracting the recipe ids into array  

    for(let i = 0; i < recipes_id_array.length; i++) {
        let recipe_id = recipes_id_array[i];
        let recipe_info = await getRecipeDetails(recipe_id, user_id);
        array_of_recipes_preview.push(recipe_info)
    }
    return array_of_recipes_preview
}


/**
 * returns a list of all information about all the recipe_ids recieved as an argument specific for my recipes
 */
async function getRecipesPreview_MyRecipes(recipes_id_array, user_id) {
    try {
        const query = `
          SELECT
            recipe_id AS id,
            title,
            readyInMinutes,
            image,
            popularity,
            IF(vegan = 1, true, false) AS vegan,
            IF(vegeterian = 1, true, false) AS vegetarian,
            IF(glutenFree = 1, true, false) AS glutenFree,
            servings,
            JSON_ARRAY(
              JSON_OBJECT('result', IF(already_watched_index = 1, true, false))
            ) AS already_watched_indicator,
            JSON_ARRAY(
              JSON_OBJECT('result', IF(favorite_index = 1, true, false))
            ) AS favorite_indicator
          FROM full_recipe
          WHERE recipe_id IN (${recipes_id_array});
        `;
    
        const [rows] = await DButils.execQuery(query);
        return rows;
      }
      catch (error) {
        return [];
      }

}


/**
 * returns 1 if the user has entered this recipe page and 0 otherwise
 */
async function didWatch(recipe_id, user_id) {
    if(!user_id) return 'false';
    return await DButils.execQuery(`SELECT IF(COUNT(*) > 0, 'true', 'false') AS result FROM last_seen_recipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`);
}


/**
 * returns 1 if the user has marked this recipe as favorite and 0 otherwise
 */
async function IsInFavorite(recipe_id, user_id) {
    if(!user_id) return 'false';
    return await DButils.execQuery(`SELECT IF(COUNT(*) > 0, 'true', 'false') AS result FROM favorite_recipes WHERE user_id = '${user_id}' AND recipe_id = '${recipe_id}'`);
}

/**
 * adds the recipe to the full recipe DB, where all the information for showing a recipe page is saved
 */
async function AddToFullRecipeDB(recipe_id, user_id) {
    let recipe_info = await getRecipeDetails(recipe_id, user_id);
    await DButils.execQuery(
        `INSERT INTO full_recipe (user_id, recipe_id, title, readyInMinutes, image, popularity, vegan, vegeterian, glutenFree, servings, already_watched_index, favorite_index) VALUES
         ('${user_id}','${recipe_id}', '${recipe_info.title}', '${recipe_info.readyInMinutes}', '${recipe_info.image}', '${recipe_info.popularity}', '${recipe_info.vegan}', '${recipe_info.vegeterian}', '${recipe_info.glutenFree}', '${recipe_info.servings}', '${recipe_info.already_watched_index}', '${recipe_info.favorite_index}')` );
}


/**
 * adds the recipe to the full recipe DB, where all the information for showing a recipe page is saved specificly for recipes the user created
 */
async function AddToFullRecipeDB_MyRecipe(user_details){
    await DButils.execQuery(
        `INSERT INTO full_recipe (user_id, recipe_id, title, readyInMinutes, image, popularity, vegan, vegeterian, glutenFree, servings, already_watched_index, favorite_index) VALUES
         ('${user_details.user_id}','${user_details.recipe_id}', '${user_details.title}', '${user_details.readyInMinutes}', '${user_details.image}', '${user_details.popularity}', '${user_details.vegan}', '${user_details.vegeterian}', '${user_details.glutenFree}', '${user_details.servings}', 0, 0)` );
}


/**
 * gets the details needed from the family_recipes DB
 */
async function getRecipesPreview_FamilyRecipes(recipes_id_array, user_id) {
    try {
        const query = `
          SELECT
            recipe_id AS id,
            title,
            readyInMinutes,
            image,
            popularity,
            IF(vegan = 1, true, false) AS vegan,
            IF(vegeterian = 1, true, false) AS vegetarian,
            IF(glutenFree = 1, true, false) AS glutenFree,
            servings,
            JSON_ARRAY(
              JSON_OBJECT('result', IF(already_watched_index = 1, true, false))
            ) AS already_watched_indicator,
            JSON_ARRAY(
              JSON_OBJECT('result', IF(favorite_index = 1, true, false))
            ) AS favorite_indicator
          FROM family_recipe
          WHERE recipe_id IN (${recipes_id_array});
        `;
    
        const [rows] = await DButils.execQuery(query);
        return rows;
      }
      catch (error) {
        return [];
      }
}


/**
 * this function is in chrge of asking the api for the query that the user wrote
 */
async function apiSearchQuery(query, number, cuisine, diet, intolerance) {
    let query_search = '';
    let default_num = 5;
    if (query) query_search = `${search}`;
    if(number){
        query_search+= `&number=${number}`;
    } else {
        query_search+= `&number=${default_num}`;
    }
    if (cuisine) query_search += `"&cuisine=${cuisine}`;
    if (diet) query_search += `"&diet=${diet}`;
    if (intolerance) query_search += `"&intolerance=${intolerance}`;
    return await axios.get(`${api_domain}/complexSearch?query=${query_search}`, {
        params: {
            apiKey: process.env.spooncular_apiKey,
            includeNutrition: false
        }
    });
}

/**
 * gets 3 random recipes from the external API
 */
async function getRandomRecipes()
{
    let number = 3;
    return await axios.get(`${api_domain}/random?number=${number}`, {
        params: {
            apiKey: process.env.spooncular_apiKey
        }
    });
}

exports.getRecipeDetails = getRecipeDetails;
exports.getRecipesPreview = getRecipesPreview;
exports.AddToFullRecipeDB = AddToFullRecipeDB;
exports.AddToFullRecipeDB_MyRecipe = AddToFullRecipeDB_MyRecipe;
exports.getRecipesPreview_MyRecipes = getRecipesPreview_MyRecipes;
exports.getRecipesPreview_FamilyRecipes = getRecipesPreview_FamilyRecipes;
exports.apiSearchQuery = apiSearchQuery;
exports.getRandomRecipes = getRandomRecipes;


