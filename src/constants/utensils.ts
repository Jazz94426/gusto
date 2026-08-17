export interface Utensil {
  id: string;
  name: string;
  icon?: string;
  image?: string;
}

export const PREDEFINED_UTENSILS: Utensil[] = [
  { id: 'food_container', name: 'Food container', image: '/utensils/food_container.jpg' },
  { id: 'kitchen_scale', name: 'Kitchen scale', image: '/utensils/kitchen_scale.jpg' },
  { id: 'measuring_jug', name: 'Measuring jug', image: '/utensils/measuring_jug.jpg' },
  { id: 'mixing_bowl', name: 'Mixing bowl', image: '/utensils/mixing_bowl.jpg' },
  { id: 'whisk', name: 'Whisk', image: '/utensils/whisk.jpg' },
  { id: 'blender', name: 'Blender', image: '/utensils/blender.jpg' },
  { id: 'oven', name: 'Oven', image: '/utensils/oven.jpg' },
  { id: 'microwave', name: 'Microwave', image: '/utensils/microwave.jpg' },
  { id: 'mold', name: 'Mold', image: '/utensils/mold.jpg' },
  { id: 'pan', name: 'Pan', image: '/utensils/pan.jpg' },
  { id: 'pastry_roll', name: 'Pastry roll', image: '/utensils/pastry_roll.jpg' },
  { id: 'piping_bag', name: 'Piping bag', image: '/utensils/piping_bag.jpg' },
];
