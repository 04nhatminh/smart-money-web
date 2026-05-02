import {
  MdFastfood,
  MdDirectionsCar,
  MdShoppingBag,
  MdLightbulb,
  MdLocalMovies,
  MdFavorite,
  MdSchool,
  MdShoppingCart,
  MdHelpOutline,
} from 'react-icons/md';

export const CATEGORY_ICONS: { [key: string]: React.ReactNode } = {
  FOOD: <MdFastfood className="w-6 h-6" />,
  TRANSPORTATION: <MdDirectionsCar className="w-6 h-6" />,
  CLOTHING: <MdShoppingBag className="w-6 h-6" />,
  UTILITIES: <MdLightbulb className="w-6 h-6" />,
  ENTERTAINMENT: <MdLocalMovies className="w-6 h-6" />,
  HEALTH: <MdFavorite className="w-6 h-6" />,
  EDUCATION: <MdSchool className="w-6 h-6" />,
  SHOPPING: <MdShoppingCart className="w-6 h-6" />,
  OTHER: <MdHelpOutline className="w-6 h-6" />,
};

export const getCategoryIcon = (category: string): React.ReactNode => {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS['OTHER'];
};
