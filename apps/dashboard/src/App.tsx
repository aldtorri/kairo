import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { RunsList } from './views/RunsList.js';
import { RunDetail } from './views/RunDetail.js';
import { Replay } from './views/Replay.js';
import { Fixes } from './views/Fixes.js';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<RunsList />} />
        <Route path="runs/:id" element={<RunDetail />} />
        <Route path="runs/:id/replay" element={<Replay />} />
        <Route path="runs/:id/fixes" element={<Fixes />} />
      </Route>
    </Routes>
  );
}
