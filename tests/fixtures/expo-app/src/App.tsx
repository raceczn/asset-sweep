import React from 'react';

const hero = require('../assets/hero.png');
const getAvatar = (id: string) => require(`../assets/avatars/${id}.png`);

export function App() {
  return { hero, getAvatar };
}
