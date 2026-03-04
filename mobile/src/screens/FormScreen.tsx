import React from 'react';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { FormType } from '../navigation';
import type { Moment, FoodSpot } from '../types';
import CreateMomentForm from './CreateMoment/CreateMomentForm';
import CreateFoodSpotForm from './CreateFoodSpot/CreateFoodSpotForm';

type Route = RouteProp<{ FormScreen: { type: FormType; data?: any } }, 'FormScreen'>;

/**
 * Generic FormScreen — single navigation route for all create/edit forms.
 * Renders the correct form component based on `type` param.
 * Passes `data` (full entity object) so form fills instantly without loading.
 */
export default function FormScreen() {
  const { type, data } = useRoute<Route>().params;

  switch (type) {
    case 'createMoment':
      return <CreateMomentForm />;
    case 'editMoment':
      return <CreateMomentForm moment={data as Moment} />;
    case 'createFoodSpot':
      return <CreateFoodSpotForm />;
    case 'editFoodSpot':
      return <CreateFoodSpotForm foodSpot={data as FoodSpot} />;
    default:
      return null;
  }
}
