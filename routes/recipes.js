var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId, 0);
    res.send(recipe);
    
  }
  catch (error) {
    next(error);
  }
});


/**
 * This path returns a list of recipes coming from the external API after using its search engine
 */
router.get("/search_query", async (req,res,next) => {
  try{
    const search= await recipes_utils.apiSearchQuery(req.body.query, req.body.number, req.body.cuisine, req.body.diet, req.body.intolerance);
    res.status(200).send(search.data);
  }
  catch(error){
    next(error); 
  }
});


/**
 * This path generates a list of 3 random recipes
 */
router.get("/random", async (req, res, next) => {
  try {
    let get_random = await recipes_utils.getRandomRecipes();
    res.send(get_random);
  } catch (error) {
    next(error);
  }
})



module.exports = router;
