var boscoQuotes = [
	"I'm BA, and you're gonna be unconcious.",
	"We are getting shot at you crazy ass fool!",
	"Let's go, fool!",
	"What is this? Will it knock me out? It better knock me out because if it don't I'm gonna knock you out.",
	"WHY WE IN A FALLING TANK?",
	"There's something wrong with your eyes, man.",
	"I'm not gettin' on a chopper with this nutjob!",
	"Why does it feel like I fell on my face?",
	"If I broke every bone in your hand, could you still do that?",
	"Give me that, fool. You got them toast points?",
	"The only reason I don't kick y'all asses is 'cause y'all outrank me.",
	"That ain't what's pissin' me off. You shooting my van is what's pissin' me off, man!",
	"Sorry, my friend. I see you've put the South African microphone at the bottom. You can't always put the CNN on top.",
	"Talk to me, talk sense so I can talk back. Not all this jibberjabber like breaking the peace and all that.",
	"Hey man, the first time ever we have guns and ammo, and can't get out of here.",
	"I love it... when a plan comes together!",
	"Freeze! Peace officers!",
	"You're a nut. And that's a conclusion based on fact!",
	"So I don't want you to take your talking dog Billy with you, or your talking bug friends.You got that?",
	"Good? It's perfect. That's the problem.",
	"Another common area bites the dust.",
	"Maybe he can't, but I can!",
	"Baby? what's that fool talking about?",
	"What kind of a change can they make with a dude like that? Aside from giving him a new brain?",
	"We gonna crash? We gonna crash?",
	"Studio? You make movies too? What do you call them, those art movies?",
	"I'm gonna play Stagecoach and run you over if you don't get out of my face.",
	"Somebody hold me down. This fool's about to play his fingers and I'm gonna snap 'em off!",
	"If you try something, you better make sure I don't get up!",
	"Hey man, I don't want those Riyows, or Ryhows, whatever it is, I want cash money!",
	"Little Lefty, meet BIG Lefty!",
	"I ain't dressing up like no nun!",
	"That reminds me, you're out of milk, you never have enough milk.",
	"Hey man, that's a tank. And that's all it is",
	"I'm glad I didn't know you when I was a kid."
];
	
$(function(){
	$('.bosco-img').on('click', function(){
    var quoteIndex = Math.floor(Math.random() * boscoQuotes.length);
    var quote = boscoQuotes[quoteIndex];

    alert('Bosco says: ' + quote);
  });
});
