// Additive metadata: never replace source difficulty, answer, unit IDs or history.
function attachCatalog(data, catalog) {
  if (catalog.branches.length !== 443 || new Set(catalog.branches.map(b=>b.id)).size !== 443) throw Error('Invalid B57 branches');
  const byId=new Map(data.problems.map(p=>[p.id,p]));
  const seen=new Set();
  for(const r of catalog.representatives){
    if(seen.has(r.inventoryId))throw Error('Duplicate inventory ID '+r.inventoryId);seen.add(r.inventoryId);
    if(!r.appProblemId)continue;
    const p=byId.get(r.appProblemId);if(!p)throw Error('Missing linked problem '+r.appProblemId);
    if(p.source?.kind==='b57-approved-original'&&(r.deliveryStatus!=='出題可能'||p.deliveryReview?.inventoryId!==r.inventoryId||p.deliveryReview?.originalSha256!==p.source.originalSha256))throw Error('Unverified delivery link '+p.id);
    if(p.b57)throw Error('Duplicate problem link '+p.id);
    p.b57={inventoryId:r.inventoryId,primaryMappings:r.primaryMappings,auxiliaryIds:r.auxiliaryIds,originalDifficulty:r.originalDifficulty,comparisonDifficulty:r.comparisonDifficulty,comparisonBasis:r.comparisonBasis,source:r.source,quality:r.quality,deliveryStatus:r.deliveryStatus,approvedCorrectConditions:r.approvedCorrectConditions};
    // Only the explicitly approved runtime calibration changes the selection band.
    if(p.source?.kind==='b57-approved-original'||catalog.calibrations.some(c=>c.inventory_id===r.inventoryId))p.b57.selectionTier={基本:'basic',標準:'standard',応用:'advanced'}[r.comparisonDifficulty];
  }
  for(const p of data.problems)if(p.source?.kind==='b57-approved-original'&&!p.b57)throw Error('Unregistered original problem '+p.id);
  data.b57Catalog=catalog;
  return data;
}
module.exports={attachCatalog};
