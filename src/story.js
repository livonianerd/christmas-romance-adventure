export const title = 'Christmas on Mistletoe Lane';
export const subtitle = 'Every Christmas has a love story.';
export const tropes = [
  'Big-city career woman', 'Returning to hometown', 'Handsome local handyman', 'Hot chocolate accident',
  'Inherited family business', 'Overenthusiastic matchmaker', 'Decorating a Christmas tree', 'Convenient romantic accident',
  'Rediscovering an old connection', 'Christmas baking montage', 'Unexpected corporate promotion', 'Romantic misunderstanding',
  'Christmas festival in jeopardy', 'Community comes together', 'Romantic reconciliation', 'Kiss beneath the mistletoe'
];
export const characters = {
  Emily: { coat:'#ae343f', dark:'#752636', hair:'#573222', scarf:'#f6dfb7', skin:'#efad84' },
  Jack: { coat:'#8e343a', dark:'#343340', hair:'#493025', scarf:'#435557', skin:'#e8a475', plaid:true },
  Margaret: { coat:'#72496d', dark:'#4d355a', hair:'#c8bcc1', scarf:'#e4bd73', skin:'#e5aa8f' },
  Lucy: { coat:'#3d726b', dark:'#275353', hair:'#512b2e', scarf:'#e8a161', skin:'#bc805b' },
  Boss: { coat:'#495875', dark:'#313a56', hair:'#453239', scarf:'#beb5a8', skin:'#d79877' }
};
const line = (speaker, text) => ({ speaker, text });
const em = text => line('Emily', text);
const jack = text => line('Jack', text);
const narration = text => line('Narrator', text);
const item = (name, icon, x, y = 0) => ({ name, icon, x, y });

export const endings = [
  { title:'A Perfect Christmas', text:'By spring, the ovens at Bennett’s Bakery were warm again. Emily kept Grandma’s gingerbread recipe on the wall and put her own name on the door.', reply:'Jack smiled. “Think I could get a standing order for two?”' },
  { title:'Christmas Together', text:'Emily negotiated a remote role. Her campaigns still reached Chicago, and her evening walks ended at the bakery with Jack.', reply:'“Good,” Jack said. “I was hoping to show you what this place looks like in July.”' },
  { title:'A New Beginning', text:'Emily and Jack opened a bakery and woodworking studio under one roof. She handled the branding. He made the breadboards. Mr. Whiskers supervised.', reply:'“Together sounds like a very good plan,” Jack said.' }
];
export const closing = 'And so, in the little town of Evergreen Falls, Emily discovered that sometimes the best Christmas gifts are the ones you never planned for.';
export const chapters = [
  {
    title:'Coming Home', world:'street', location:'Evergreen Falls, Michigan', length:930, target:40,
    objective:'Find the belongings that fell from your suitcase.', destination:'Meet Jack outside Bennett’s Bakery.',
    items:[item('Train ticket','ticket',215),item('Leather planner','book',415,11),item('Bakery key','key',650)],
    obstacles:[{x:398,w:32,h:11}], goal:{x:827,label:'Jack',npc:'Jack'}, unlock:[0,1,3], event:'spill',
    intro:[narration('Emily Bennett had everything she thought she wanted. A successful career, a Chicago apartment, and absolutely no plans to fall in love this Christmas.')],
    dialogue:[jack("Well, that's one way to make a memorable entrance."),em("I'm usually much more coordinated in Chicago."),jack("Emily Bennett? You're the last person I expected to see before Christmas."),em('Trust me. The feeling is mutual.')]
  },
  {
    title:'An Unexpected Partnership', world:'bakery', location:'Bennett’s Bakery', length:950, target:50,
    objective:'Gather supplies for the bakery repairs.', destination:'Bring the supplies to Jack.',
    items:[item('Hammer','hammer',237),item('Christmas lights','lights',455),item('Christmas wreath','wreath',688)],
    obstacles:[{x:440,w:28,h:11}], goal:{x:855,label:'Jack',npc:'Jack'}, npcs:[{name:'Margaret',x:750}],
    unlock:[4,2,5], event:'repair',
    intro:[em('Grandma left me a bakery, three recipe books, and a front door that sticks.'),jack('I can fix the door. The recipe books are above my pay grade.')],
    dialogue:[em("I'm only fixing it up so I can sell it."),jack('Of course. Nobody ever changes their plans at Christmas.'),line('Margaret','You two make quite a team!'),em("We've been working together for approximately seven minutes.")]
  },
  {
    title:'Finding the Perfect Tree', world:'forest', location:'Pine Ridge Tree Farm', length:1090, target:60,
    objective:'Collect the ornaments along the snowy trail.', destination:'Cross the bridge and pick the perfect tree.',
    items:[item('Cranberry bauble','red',229),item('Golden bauble','gold',555,8),item('Evergreen bauble','green',801)],
    obstacles:[{x:515,w:80,h:8,bridge:true}], companion:'Jack', goal:{x:980,label:'Christmas tree'}, unlock:[6,7,8], event:'catch',
    intro:[jack('My favorite tree is across the creek. I may have set it aside when I heard you were coming.'),em('You pre-selected my spontaneous Christmas tree?')],
    dialogue:[jack('Careful. The snow gets slippery around here.'),em('Apparently, so does my carefully planned life.'),jack("You know, this town hasn't been quite the same since you left."),{speaker:'Emily',text:'Emily looks out over the snowy trees.', choices:[
      {label:"I've missed it more than I expected.",reply:'Then it’s good you came back long enough to notice.'},
      {label:"I think I've missed someone, too.",reply:'I was hoping you’d say that. I’ve missed you, Emily.'},
      {label:'Is that your best Christmas movie line?',reply:'I was saving the good one for when it starts snowing. Ah. Looks like I missed my cue.'}
    ]}]
  },
  {
    title:'Christmas Cookie Chaos', world:'kitchen', location:'Bennett’s Bakery Kitchen', length:1010, target:50,
    objective:'Find the four gingerbread ingredients.', destination:'Bring the ingredients to the prep table.',
    items:[item('Flour','flour',201),item('Sugar','sugar',370),item('Butter','butter',550),item('Gingerbread spices','spice',735)],
    obstacles:[{x:532,w:31,h:10}], goal:{x:900,label:'Prep table'}, npcs:[{name:'Lucy',x:295},{name:'Jack',x:944}],
    unlock:[9,10,11], event:'bake',
    intro:[line('Lucy','Your grandmother always made one extra batch, in case someone needed a reason to stay.'),em('I’m just trying to get through the first batch. Where did she keep the ginger?')],
    dialogue:[line('Boss',"Emily, congratulations. The promotion is yours. We need you back in Chicago tomorrow."),em("Tomorrow? But it's Christmas Eve."),jack('Congratulations. I guess Evergreen Falls was never really part of the plan.'),em('Jack? Wait. You only heard half of that.')]
  },
  {
    title:'The Christmas Eve Crisis', world:'square', location:'Evergreen Falls Town Square', length:1080, target:60,
    objective:'Find the extension cord, fuse, and tree star.', destination:'Bring everything to the festival control box.',
    items:[item('Extension cord','cord',225),item('Replacement fuse','fuse',470),item('Tree star','star',714)],
    obstacles:[{x:454,w:32,h:11}], goal:{x:941,label:'Festival control box'}, npcs:[{name:'Margaret',x:136},{name:'Lucy',x:544}], unlock:[12,13,14], event:'illuminate',
    intro:[line('Margaret','The festival lights are out. I promised the whole town a tree lighting, so naturally I told everyone you had a plan.'),em('I do now. Let’s find the missing parts.')],
    dialogue:[em("I couldn't have done this without you."),jack("I was hoping you wouldn't have to."),em('About Chicago... I think we need to talk.')]
  },
  {
    title:'A Christmas Wish', world:'finale', location:'The Mistletoe Gazebo', length:940, target:40,
    objective:'Meet Jack beneath the mistletoe.', destination:'Meet Jack beneath the mistletoe.',
    items:[], obstacles:[], goal:{x:775,label:'Jack',npc:'Jack'}, unlock:[15], event:'kiss',
    intro:[narration('Later, after the last carol, Emily finds a familiar figure waiting under the gazebo.')],
    dialogue:[jack('So, what happens after Christmas?'),{speaker:'Emily',text:'The lights shine through the gently falling snow.',choices:[
      {label:"I think it's time to reopen Grandma's bakery.",ending:0},
      {label:"Maybe Chicago isn't the only place I can build a career.",ending:1},
      {label:'What would you say to building something together?',ending:2}
    ]}]
  }
];
export const numbers = ['One','Two','Three','Four','Five','Six'];
