var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  }
  else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id,recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    await recipe_utils.AddToFullRecipeDB(user_id, recipe_id);
  }
  catch(error) {
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
    try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];

    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array   
    const results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(201).send(results);
  } 
  catch(error) {
    next(error); 
  }
});


/**
 * This path gets body with recipeId and save this recipe in the my_recipe DB of the logged-in user
 */
router.post('/MyRecipes', async (req,res,next) => {
  let id = await DButils.execQuery(`SELECT COUNT(*) AS row_count FROM my_recipe`);
  let recipe_id = id[0].row_count;
  try {
    let user_details = {
      user_id: req.session.user_id,
      recipe_id: recipe_id,
      title: req.body.title,
      readyInMinutes: req.body.readyInMinutes,
      image: req.body.image,
      popularity: req.body.popularity,
      vegan: req.body.vegan,
      vegeterian: req.body.vegeterian,
      glutenFree: req.body.glutenFree,
      servings: req.body.servings

    } 

    await user_utils.AddToMyRecipeDB(user_details.recipe_id, user_details.user_id);
    res.status(201).send({ message: "Recipe created", success: true });
    await recipe_utils.AddToFullRecipeDB_MyRecipe(user_details);

  }
  catch(error) {
    next(error);
  }
})


/**
 * This path returns the recipes that the user created
 */
router.get('/MyRecipes', async (req,res,next) => {
    try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getMyRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array   
    const results = await recipe_utils.getRecipesPreview_MyRecipes(recipes_id_array, user_id);
    res.status(201).send(results);
  } 
  catch(error) {
    next(error); 
  }
});


/**
 * This path returns the recipes that are stored in the family recipes DB and we uploaded in advance
 */
router.get('/FamilyRecipes', async (req,res,next) => {
    try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getFamilyRecipeDB(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array   
    const results = await recipe_utils.getRecipesPreview_FamilyRecipes(recipes_id_array, user_id);
    res.status(201).send(results);
  } 
  catch(error) {
    next(error); 
  }
});


/**
 * This path returns the recipes that are stored in the family recipes DB and we uploaded in advance
 */
router.get('/LastSeen', async (req,res,next) => {
    try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getLastSeen(user_id);
    if (recipes_id.length === 0) throw { status: 409, message: "There are no last seen recipes" };

    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array   
    const results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(201).send(results);
  } 
  catch(error) {
    next(error); 
  }
});


module.exports = router;
