const scheduler = require('../../misc/scheduler');
const rewardGenerator = require('../../misc/rewardGenerator');
const mail = require('../../mail/mail');
const events = require('../../misc/events');

const calculateDaysSkipped = (oldTime, newTime) => {
	let daysSkipped = 1;

	if (oldTime.year === newTime.year && oldTime.month === newTime.month) { 
		//Same year and month
		daysSkipped = newTime.day - oldTime.day;
	} else if (oldTime.year === newTime.year) {
		//Same month
		let daysInMonth = scheduler.daysInMonth(oldTime.month);
		daysSkipped = (daysInMonth - oldTime.day) + newTime.day;

		for (let i = oldTime.month + 1; i < newTime.month - 1; i++) 
			daysSkipped += scheduler.daysInMonth(i);
	} else {
		//Different year and month
		const daysInMonth = scheduler.daysInMonth(oldTime.month);
		daysSkipped = (daysInMonth - oldTime.day) + newTime.day;

		for (let i = oldTime.year + 1; i < newTime.year - 1; i++)
			daysSkipped += 365;

		for (let i = oldTime.month + 1; i < 12; i++) 
			daysSkipped += scheduler.daysInMonth(i);

		for (let i = 0; i < newTime.month - 1; i++) 
			daysSkipped += scheduler.daysInMonth(i);
	}

	return daysSkipped;
};

module.exports = async (cpnAuth, data, character, cbDone) => {
	const accountInfo = cpnAuth.accountInfo;

	const time = scheduler.getTime();
	let { lastLogin, loginStreak } = accountInfo;

	accountInfo.lastLogin = time;

	if (
		!lastLogin ||
		(
			lastLogin.day === time.day &&
			lastLogin.month === time.month &&
			lastLogin.year === time.year
		)
	) {
		cbDone();
		return;
	}

	const daysSkipped = calculateDaysSkipped(lastLogin, time);
	if (daysSkipped === 1)
		loginStreak++;
	else
		loginStreak = 1;

	loginStreak = Math.max(1, Math.min(21, loginStreak));
	accountInfo.loginStreak = loginStreak;

	const itemCount = 1 + ~~(loginStreak / 2);
	const rewardConfig = [];
	events.emit('onBeforeGenerateLoginRewards', rewardConfig);
	
	const rewards = rewardGenerator(itemCount, rewardConfig);
	if (!rewards.length) {
		cbDone();
		return;
	}

	rewards[0].msg = `Daily login reward for ${loginStreak} day${(loginStreak > 1) ? 's' : ''}:`;

	mail.sendMail(character.name, rewards, cbDone);
};
