(function (root) {
  'use strict';
  const MAX_LEVEL = 10;
  const clone = value => JSON.parse(JSON.stringify(value));
  const validRank = item => item && typeof item.id === 'string' && item.id.length > 0 && Number.isInteger(item.rank) && item.rank >= 1 && item.rank <= 5;
  const equipmentList = catalog => Array.isArray(catalog) ? catalog : catalog && catalog.equipment;
  function checkedCatalog(catalog) {
    const list = equipmentList(catalog);
    if (!Array.isArray(list) || !list.length || list.some(item => !validRank(item)) || new Set(list.map(item => item.id)).size !== list.length) return null;
    return list;
  }
  function gearProgress(item, level = 1) {
    if (!validRank(item)) throw new TypeError('装備の品質を確認できません');
    const numeric = Number(level);
    level = Number.isFinite(numeric) ? Math.min(MAX_LEVEL, Math.max(1, Math.floor(numeric))) : 1;
    return {level, maxLevel: MAX_LEVEL, power: item.rank * 10 + (level - 1) * 3, nextCost: level === MAX_LEVEL ? null : level + 1, maxed: level === MAX_LEVEL};
  }
  function validState(state) {
    return state && Array.isArray(state.inventory?.equipment) && Number.isSafeInteger(state.materials) && state.materials >= 0 &&
      (state.loadout?.equipment == null || Array.isArray(state.loadout.equipment) && state.loadout.equipment.length <= 3);
  }
  function discoverEquipment(state, catalog, {random = Math.random} = {}) {
    const fail = error => ({state, result: {valid: false, error}});
    const list = checkedCatalog(catalog);
    if (!list) return fail('装備の一覧を確認できません');
    if (!validState(state)) return fail('装備や素材の記録を確認できません');
    if (!Number.isSafeInteger(state.equipmentBoxes) || state.equipmentBoxes < 1) return fail('装備箱が1個必要です');
    const count = state.equipmentDiscoveries ?? 0;
    if (!Number.isSafeInteger(count) || count < 0 || count >= Number.MAX_SAFE_INTEGER) return fail('発見回数の記録を確認できません');
    let roll;
    try { roll = random(); } catch (_) { return fail('装備の抽選に失敗しました'); }
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) return fail('装備の抽選値を確認できません');
    const item = list[Math.min(list.length - 1, Math.floor(roll * list.length))];
    const duplicate = state.inventory.equipment.includes(item.id), refund = duplicate ? 3 : 0;
    if (state.materials > Number.MAX_SAFE_INTEGER - refund) return fail('素材の上限を超えます');
    const next = clone(state);
    next.equipmentBoxes -= 1;
    next.equipmentDiscoveries = count + 1;
    next.materials += refund;
    if (!duplicate) {
      next.inventory.equipment.push(item.id);
      next.equipmentTraining = next.equipmentTraining || {};
      next.equipmentTraining[item.id] = 1;
      next.loadout = next.loadout || {hero: null, equipment: []};
      next.loadout.equipment = next.loadout.equipment || [];
      if (next.loadout.equipment.length < 3 && !next.loadout.equipment.includes(item.id)) next.loadout.equipment.push(item.id);
    }
    return {state: next, result: {valid: true, gearId: item.id, duplicate, refund, discoveryCount: next.equipmentDiscoveries}};
  }
  function trainEquipment(state, id, catalog) {
    const fail = error => ({state, result: {valid: false, error}});
    const list = checkedCatalog(catalog);
    if (!list) return fail('装備の一覧を確認できません');
    if (!validState(state)) return fail('装備や素材の記録を確認できません');
    const item = list.find(item => item.id === id);
    if (!item || !state.inventory.equipment.includes(id)) return fail('手に入れた装備だけを鍛錬できます');
    const previousLevel = state.equipmentTraining?.[id] ?? 1;
    if (!Number.isInteger(previousLevel) || previousLevel < 1 || previousLevel > MAX_LEVEL) return fail('鍛錬レベルの記録を確認できません');
    const progress = gearProgress(item, previousLevel);
    if (progress.maxed) return fail('この装備は鍛錬Lv10です');
    const cost = progress.nextCost;
    if (state.materials < cost) return fail('鍛錬素材が足りません');
    const next = clone(state), level = previousLevel + 1;
    next.materials -= cost;
    next.equipmentTraining = next.equipmentTraining || {};
    next.equipmentTraining[id] = level;
    return {state: next, result: {valid: true, gearId: id, level, previousLevel, power: gearProgress(item, level).power, cost}};
  }
  const api = {gearProgress, discoverEquipment, trainEquipment};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SansuGear = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
