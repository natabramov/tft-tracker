import { ref, getDownloadURL } from "firebase/storage";
import tacticianData from "../dragontail-15.4.1/15.4.1/data/en_US/tft-tactician.json";
import traitData from "../dragontail-15.4.1/15.4.1/data/en_US/tft-trait.json";
import unitData from "../dragontail-15.4.1/15.4.1/data/en_US/tft-champion.json";
import { storage } from '/backend/Firebase';

const championLookup = Object.keys(unitData.data).reduce((map, key) => {
  const unit = unitData.data[key];
  if (unit.id) {
    map[unit.id.toLowerCase()] = unit;
  }
  return map;
}, {});

function convertUnixToDate(unixTime) {
  const date = new Date(unixTime);
  return date.toLocaleDateString();
}

export const fetchPlayerMatchData = async (playerData) => {
  console.log("player data", playerData)
  if (!playerData?.info.participants) {
    console.log("No match data available.");
    return [];
  }

  const matchData = [];

  for (const participant of playerData.info.participants) {
    if (participant.companion.item_ID == null) {
        console.log("No participant companion (tactician) ID found");
    }

    const companion = participant.companion;
    const companionID = companion.item_ID;

    if (companionID == null) {
        console.log("No companion ID found for participant:", participant.puuid);
    }

    const tacticianID = tacticianData.data[companionID];
    if (tacticianID == null) {
        console.log(`No tactician found for item ID: ${tacticianID}`);
    }

    const tacticianImagePath = tacticianID.image.full;
    const tacticianImageStorageRef = ref(storage, `dragontail-15.4.1/15.4.1/img/tft-tactician/${tacticianImagePath}`);

    // TRAITS
    let traitImageUrls = [];
    const sortedTraits = participant.traits.sort((a, b) => b.tier_current - a.tier_current);
    for (const trait of sortedTraits) {
      if (!trait) {
        console.log("Error finding traits")
      }

      const traitName = trait.name;
      const traitNumUnits = trait.num_units;
      const traitStyle = trait.style;
      const traitCurrentTier = trait.tier_current;
      const traitTotalTier = trait.tier_total;

      if ((traitName || traitNumUnits || traitStyle || traitCurrentTier || traitTotalTier) == null) {
        console.log(`Error with traits -- trait name: ${traitName} trait num units: ${traitNumUnits} trait style: ${traitStyle} trait current tier: ${traitCurrentTier} trait total tier: ${traitTotalTier}`)
      }

      if (traitStyle){
        const traitID = traitData.data[traitName];
        if (traitID == null){
          console.log(`No trait ID found for trait ID: ${traitID} in trait json`);
        }
  
        const traitImagePath = traitID.image.full
        const traitImageStorageRef = ref(storage, `dragontail-15.4.1/15.4.1/img/tft-trait/${traitImagePath}`);
        try {
          const traitImageUrl = await getDownloadURL(traitImageStorageRef);
          traitImageUrls.push(traitImageUrl); // Store each trait image URL in the array
        } catch (error) {
          console.error(`Error fetching trait image for trait: ${traitName}`, error);
        }
      }

    }

    // UNITS
    // let unitImageUrls = [];
    let units = [];
    // note: tft-champion.json gives correct costs. change to this instead of rarity
    const sortedUnits = participant.units.sort((a, b) => b.rarity - a.rarity);
    for (const unit of sortedUnits) {
      if (!unit) {
        console.log("Error finding units")
      }

      let unitID = unit.character_id.toLowerCase();
      const unitItemNames = unit.itemNames; // need images for this too
      const unitName = unit.name;  // often blank
      const unitRarity = unit.rarity; // doesn't equate to unit cost
      const unitTier = unit.tier; // 1* 2* etc

      if ((unitID || unitItemNames || unitName || unitRarity || unitTier) == null) {
        console.log(`Error with units -- units id: ${unitID} unit items: ${unitItemNames} unit name (usually blank) ${unitName} unit rarity: ${unitRarity} unit star tier: ${unitTier}`)
      }

      if (unitID === "tft13_jaycesummon" || unitID === "tft13_sion"){
        console.log("skipping", unitID)
        continue;
      }

      const unitLookupID = championLookup[unitID].id;
      if (unitLookupID == null) {
        console.log(`No unit ID found for unit ID: ${unitID} in unit json ${unitLookupID}`);
      }

      const unitImagePath = championLookup[unitID].image.full
      const unitImageStorageRef = ref(storage, `dragontail-15.4.1/15.4.1/img/tft-champion/${unitImagePath}`);

      try {
        const unitImageUrl = await getDownloadURL(unitImageStorageRef);
        units.push({
          imageUrl: unitImageUrl,
          tier: unitTier,
        });
      } catch (error) {
        console.error(`Error fetching trait image for unit: ${unitID}`, error);
      }
    }


    try {
        const tacticianImageUrl = await getDownloadURL(tacticianImageStorageRef);
        matchData.push({
            puuid: participant.puuid,
            imageUrl: tacticianImageUrl,
            riotIdGameName: participant.riotIdGameName,
            riotIdTagline: participant.riotIdTagline,
            placement: participant.placement,
            finalLevel: participant.level,
            roundEliminated: participant.last_round,
            goldLeft: participant.gold_left,
            dmgToPlayers: participant.total_damage_to_players,
            traitImages: traitImageUrls,
            units: units,
            matchTime: convertUnixToDate(playerData.info.game_datetime)});
    } catch (error) {
        console.error(`Error fetching match data for item ID ${companionID}:`, error);
    }
  }

  return matchData;
};
