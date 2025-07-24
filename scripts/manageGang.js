/** @param {NS} ns **/
export async function main(ns) {
    let gangPower = 0;
    var nextGangClashStart = new Date();
    var nextGangClashStop = new Date();
    var firstGangClashPassed = false;

		let allEquipment = ns.gang.getEquipmentNames();

	while(true) {
		let gangInfo = ns.gang.getGangInformation();
		let memberNames = ns.gang.getMemberNames();
		let gangMembers = GetMembersInfo(memberNames);

		if(gangPower != gangInfo.power || gangPower == 0) {
				let now = new Date();
				nextGangClashStart = new Date(now.setSeconds(now.getSeconds() + 19))
				nextGangClashStop = new Date(now.setSeconds(now.getSeconds() + 21))

				if (gangPower != 0) {
						firstGangClashPassed = true;
				}

				gangPower = gangInfo.power;
		}

		RecruitMembers(gangMembers);
		EquiptMembers(gangMembers, allEquipment)
		AscendMembers(gangMembers);
		AssignMembersToTask(gangMembers, gangInfo);
		EngageTerritoryWarfareIfReady(gangInfo);

		await ns.sleep(100);
	}

	function AscendMembers(members) {
        const targetAscLevelIncrease = 1.2;

        members.forEach(member => {
            const ascensionResult = ns.gang.getAscensionResult(member.name);
            //ns.print(Ascension res for ${member.name}: ${JSON.stringify(ascensionResult, null, 4)});

            if (!AreMultipliersMaxed(member) && ascensionResult) {
                const hackAtTarget = targetAscLevelIncrease <= ascensionResult.hack;
                const strAtTarget = targetAscLevelIncrease <= ascensionResult.str;
                const defAtTarget = targetAscLevelIncrease <= ascensionResult.def;
                const dexAtTarget = targetAscLevelIncrease <= ascensionResult.dex;
                const agiAtTarget = targetAscLevelIncrease <= ascensionResult.agi;
                const chaAtTarget = targetAscLevelIncrease <= ascensionResult.cha;

                if (hackAtTarget || strAtTarget || defAtTarget || dexAtTarget || agiAtTarget || chaAtTarget ) {
                    ns.gang.ascendMember(member.name);
                }
            }
        });
    }

    function AssignMembersToTask(members, gangInfo) {

        members.forEach(member => {
						// First priority is to handle Gang Clashes
						let task = "Territory Warfare";
            let now = new Date();
            ns.print(now)
            ns.print(nextGangClashStart)

            let clashIsExpected = !(now < nextGangClashStart || now > nextGangClashStop);

            if(clashIsExpected) {
                ns.gang.setMemberTask(member.name, task);
                return;
            }

						// Default to Human Trafficking if gang clashes have started
						if (firstGangClashPassed) {
                task = "Human Trafficking";
            }

						// Second Priority is to train for max ascension
            const targetAscLevelIncrease = 10;
            const strAtTarget = targetAscLevelIncrease <= member.str_asc_mult;
            const defAtTarget = targetAscLevelIncrease <= member.def_asc_mult;
            const dexAtTarget = targetAscLevelIncrease <= member.dex_asc_mult;
            const agiAtTarget = targetAscLevelIncrease <= member.agi_asc_mult;
            const hackAtTarget = targetAscLevelIncrease <= member.hack_asc_mult;
            const chaAtTarget = targetAscLevelIncrease <= member.cha_asc_mult;
            const needsTraining = !(strAtTarget && defAtTarget && dexAtTarget && agiAtTarget);

            if(needsTraining) {
                task = "Train Combat";
            } else if(!hackAtTarget) {
                task =  "Train Hacking";
            } else if(!chaAtTarget) {
                task = "Train Charisma";
            }
            
            let wantedLevel = ns.formulas.gang.wantedPenalty(gangInfo);

            if(wantedLevel < 0.4) {
                task = "Vigilante Justice" 
            }

            ns.gang.setMemberTask(member.name, task);
        });
    }

    function AreMultipliersMaxed(member) {
        const maxAscMultiplier = 30;

        return  member.hack_asc_mult > maxAscMultiplier
            && member.str_asc_mult > maxAscMultiplier
            && member.def_asc_mult > maxAscMultiplier
            && member.dex_asc_mult > maxAscMultiplier
            && member.agi_asc_mult > maxAscMultiplier
            && member.cha_asc_mult > maxAscMultiplier;
    }

    function EquiptMembers(members, equiptment) {
        members.forEach(member => {
            equiptment.forEach(item => {
                if(ns.gang.getEquipmentCost(item) < ns.getPlayer().money) {
                    ns.gang.purchaseEquipment(member.name, item);
                }
            });
        });
    }

    function RecruitMembers(members) {
			const names = [ "Bruiser", "Spike", "Bones", "Scar", "Spider", "Blade", "Ghost", "Rocket", "Bubs", "Rock", "Steady", "Vixen", "Ghoul" ]
			let memberCount = ns.gang.getMemberNames().Length;
      if (ns.gang.canRecruitMember()) {
				ns.gang.recruitMember(names.at(memberCount))
			}
    }

		function GetMembersInfo(names) {
			return names.map(name => ns.gang.getMemberInformation(name));
		}

    function EngageTerritoryWarfareIfReady(gangInfo) {

        const gangs = [ "Slum Snakes", "Speakers for the Dead", "The Black Hand", "The Dark Army", "The Syndicate", "NiteSec", "Tetrads" ]

        let shouldEngageInWarfare = true;

        for(let i = 0; i < gangs.length; i++) {

            let currentGang = gangs[i];
            let isEnemyGang = currentGang != gangInfo.faction;

            if(isEnemyGang && ns.gang.getChanceToWinClash(currentGang) < 0.6) {
                ns.print(`Can't win against ${currentGang}`);
                shouldEngageInWarfare = false;
            }
        }

        ns.gang.setTerritoryWarfare(shouldEngageInWarfare);
    }
}
