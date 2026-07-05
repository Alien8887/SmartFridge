import { Mode } from '../types';
import { Snowflake, Leaf, Users, Moon, Apple, Calendar } from 'lucide-react';

export const modes: Mode[] = [
  { id: 'normal', name: 'Normal', icon: Snowflake },
  { id: 'eco', name: 'Eco', icon: Leaf },
  { id: 'party', name: 'Party', icon: Users },
  { id: 'ramadan', name: 'Ramadan', icon: Moon },
  { id: 'diet', name: 'Diet', icon: Apple },
  { id: 'travel', name: 'Travel', icon: Calendar },
];