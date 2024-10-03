import { useState, useEffect } from "react";
import useLocalStorageState from "use-local-storage-state";
import styled from "styled-components";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
  instructions: string;
  servings: number;
}

const AppContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(45deg, #ff9a9e, #fad0c4, #ffecd2);
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
`;

const StyledListItem = styled(ListItem)`
  && {
    background-color: rgba(255, 255, 255, 0.7);
    margin-bottom: 1rem;
    border-radius: 10px;
    transition: all 0.3s ease;
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
  }
`;

const StyledTypography = styled(Typography)`
  && {
    font-family: 'Pacifico', cursive;
    color: #ff6b6b;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

function App() {
  const [recipes, setRecipes] = useLocalStorageState<Recipe[]>("recipes", {
    defaultValue: [],
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [newServings, setNewServings] = useState(1);

  useEffect(() => {
    if (recipes.length === 0) {
      const boilerplateRecipes: Recipe[] = [
        {
          id: 1,
          name: "Spaghetti Carbonara",
          ingredients: [
            { name: "Spaghetti", amount: 400, unit: "g" },
            { name: "Pancetta", amount: 150, unit: "g" },
            { name: "Eggs", amount: 4, unit: "" },
            { name: "Parmesan cheese", amount: 100, unit: "g" },
          ],
          instructions: "1. Cook pasta. 2. Fry pancetta. 3. Mix eggs and cheese. 4. Combine all ingredients.",
          servings: 4,
        },
        {
          id: 2,
          name: "Chicken Stir Fry",
          ingredients: [
            { name: "Chicken breast", amount: 500, unit: "g" },
            { name: "Mixed vegetables", amount: 400, unit: "g" },
            { name: "Soy sauce", amount: 3, unit: "tbsp" },
          ],
          instructions: "1. Cut chicken. 2. Stir fry vegetables. 3. Add chicken and soy sauce. 4. Cook until done.",
          servings: 3,
        },
        {
          id: 3,
          name: "Greek Salad",
          ingredients: [
            { name: "Cucumber", amount: 1, unit: "" },
            { name: "Tomatoes", amount: 4, unit: "" },
            { name: "Red onion", amount: 1, unit: "" },
            { name: "Feta cheese", amount: 200, unit: "g" },
            { name: "Olive oil", amount: 3, unit: "tbsp" },
          ],
          instructions: "1. Chop vegetables. 2. Crumble feta. 3. Mix all ingredients. 4. Drizzle with olive oil.",
          servings: 4,
        },
        {
          id: 4,
          name: "Banana Smoothie",
          ingredients: [
            { name: "Bananas", amount: 2, unit: "" },
            { name: "Milk", amount: 250, unit: "ml" },
            { name: "Honey", amount: 1, unit: "tbsp" },
          ],
          instructions: "1. Peel bananas. 2. Blend all ingredients until smooth.",
          servings: 2,
        },
        {
          id: 5,
          name: "Guacamole",
          ingredients: [
            { name: "Avocados", amount: 3, unit: "" },
            { name: "Lime juice", amount: 2, unit: "tbsp" },
            { name: "Red onion", amount: 0.5, unit: "" },
            { name: "Cilantro", amount: 2, unit: "tbsp" },
          ],
          instructions: "1. Mash avocados. 2. Chop onion and cilantro. 3. Mix all ingredients. 4. Season to taste.",
          servings: 4,
        },
      ];
      setRecipes(boilerplateRecipes);
    }
  }, [recipes, setRecipes]);

  const handleOpenDialog = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setNewServings(recipe.servings);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRecipe(null);
    setNewServings(1);
  };

  const handleUpdateServings = () => {
    if (editingRecipe) {
      const scaleFactor = newServings / editingRecipe.servings;
      const updatedRecipe: Recipe = {
        ...editingRecipe,
        servings: newServings,
        ingredients: editingRecipe.ingredients.map((ingredient) => ({
          ...ingredient,
          amount: Number((ingredient.amount * scaleFactor).toFixed(2)),
        })),
      };
      setRecipes(recipes.map((r) => (r.id === updatedRecipe.id ? updatedRecipe : r)));
      handleCloseDialog();
    }
  };

  return (
    <AppContainer>
      <StyledTypography variant="h3" gutterBottom>
        Funky Recipe Book
      </StyledTypography>
      <List>
        {recipes.map((recipe) => (
          <StyledListItem key={recipe.id}>
            <ListItemText
              primary={<Typography variant="h6">{recipe.name}</Typography>}
              secondary={`Servings: ${recipe.servings}`}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                aria-label="edit"
                onClick={() => handleOpenDialog(recipe)}
              >
                <EditIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </StyledListItem>
        ))}
      </List>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingRecipe?.name}</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Adjust servings:</Typography>
          <Slider
            value={newServings}
            onChange={(_, value) => setNewServings(value as number)}
            min={1}
            max={20}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
          <Typography variant="h6" gutterBottom>Ingredients:</Typography>
          <List>
            {editingRecipe?.ingredients.map((ingredient, index) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`}
                />
              </ListItem>
            ))}
          </List>
          <Typography variant="h6" gutterBottom>Instructions:</Typography>
          <Typography>{editingRecipe?.instructions}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleUpdateServings} color="primary">
            Update Servings
          </Button>
        </DialogActions>
      </Dialog>
    </AppContainer>
  );
}

export default App;