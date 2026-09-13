'use strict';

/* ================================================================
   序章 · 1945—1978
   原本是独立的 prologue/first.html（iframe 加载），现在拆开融入主游戏：
   面板、对话引擎、分支选择全部搬进这个文件，直接操作 game.html 里的
   DOM，不再需要单独的页面/iframe。触发和收尾仍然接在 11-farmland.js
   的"查看第一份简历"流程上（openFarmResumeStory / completeFarmResumeStory）。
   ================================================================ */

const PROLOGUE_WHO_NAME = {
    narration: '旁　白', mother: '母　亲', father: '父　亲', grandfather: '祖　父',
    you: '你', ahai: '阿　海', captain: '队长老陈', guide: '农场接引员',
    tallboy: '高个子知青', zhaobo: '赵　伯', xiulan: '秀　兰', messenger: '捎话的人'
};
const PROLOGUE_STAT_NAME = {
    resilience: '坚韧', ahai_bond: '与阿海的情谊', negotiation_skill: '谈判', father_bond: '与父亲的羁绊'
};
const PROLOGUE_STAT_ORDER = ['resilience', 'ahai_bond', 'negotiation_skill', 'father_bond'];

const PROLOGUE_SCENES = [
    {
        chapter: '第一幕 · 旧式宅院', tag: '宿迁 · 一九四五年秋',
        img: 'prologue/assets/bg/scenes1-1.webp', alt: '旧宅院',
        lines: [
            { who: 'narration', text: '1945年，秋天。' },
            { who: 'narration', text: '江苏宿迁，一条叫不出名字的老巷深处。祖父的宅子还在，但里里外外已经搬空了大半。' },
            { who: 'narration', text: '几个月前，日本人投降了。街上有人放鞭炮，有人哭，有人连夜换了门前的旗子。但对于这个家来说，真正的动荡，才刚要开始。' }
        ]
    },
    {
        chapter: '第一幕 · 内室', tag: '内室 · 一九四五年秋',
        img: 'prologue/assets/bg/scenes1-2.webp', alt: '内室 · 父母与婴儿',
        lines: [
            { who: 'mother', text: '……你看清楚了？真的……一封都没有了？' },
            { who: 'father', text: '上个月还有两份，这个月……全停了。说是"新政府要重新审核旧人员的任用"，我父亲的老关系……现在都成了忌讳。' },
            { who: 'mother', text: '那你打算怎么办？' },
            { who: 'father', text: '……我写了几封信，托人问问杭州那边，有没有相熟的商号能收留。实在不行，卖字画也能撑一阵。' },
            { who: 'mother', text: '这孩子来得不是时候。' },
            { who: 'father', text: '……不。他来得正是时候。这个家，得有人往下走。' }
        ]
    },
    {
        chapter: '第一幕 · 新生', tag: '内室 · 一九四五年秋',
        img: 'prologue/assets/bg/出生孩子.webp', alt: '新生婴儿',
        lines: [
            { who: 'narration', text: '你当然不记得这一天。但很多年后，母亲偶尔提起，说那天的风特别大，院子里的老槐树落了一地的叶子，像是整个时代都在掉叶子。' }
        ]
    },
    {
        chapter: '第二幕 · 祖父的书房', tag: '书房 · 一九四五年秋',
        img: 'prologue/assets/bg/scenes1-3.webp', alt: '祖父的书房',
        lines: [
            { who: 'narration', text: '祖父曾经是张作霖手下的一名财政官员。在北洋时代，那是个能让人敬畏的职位。' },
            { who: 'narration', text: '但北洋散了，东北易帜，抗战，然后是国共内战……每一次政权更迭，都像一把刀，把"家世"两个字削去一层。' },
            { who: 'grandfather', text: '（一边封箱，一边对身边的父亲说，语气急促但不失沉稳）' },
            { who: 'grandfather', text: '这些卷宗，今晚全部烧掉。一页不留。' },
            { who: 'father', text: '爹……真的没有别的办法了？您在沈阳这么多年，总还有……' },
            { who: 'grandfather', text: '糊涂！现在不是讲"还有"的时候。新政府看的是成分，不是功劳。这些东西留下来，就是给子孙后代的催命符。' },
            { who: 'grandfather', text: '我这一辈子的字纸，就烧在这院子里了。你记住——往后这个家，不靠祖宗，靠手脚。' },
            { who: 'narration', text: '那些卷宗和信函，当晚在后院化成了灰烬。祖父从此闭门不出，不再提任何旧事。而"成分"这两个字，像一枚暗钉，从此钉进了这个家庭的户口簿里。' }
        ]
    },
    {
        chapter: '第三幕 · 杭州阁楼', tag: '杭州 · 一九五〇年代',
        img: 'prologue/assets/bg/scenes1-4.webp', alt: '杭州老街阁楼',
        lines: [
            { who: 'narration', text: '祖父去世后，父亲变卖了宿迁最后的家产，举家迁往杭州。寄居在远房亲戚腾出的一间阁楼里。' },
            { who: 'narration', text: '曾经识文断字的父亲，如今只能在一些小商号里抄账本、写对联，赚一点零散的润笔。有时一个月都接不到一单活。' },
            { who: 'narration', text: '母亲阿娟——她原本是殷实人家的女儿，读过几年私塾——经人介绍，在附近的一所小学谋到了一个代课教员的职位。每月工资不到三十块，却要养活五口人。' }
        ]
    },
    {
        chapter: '第三幕 · 阁楼夜', tag: '杭州阁楼 · 油灯夜',
        img: 'prologue/assets/bg/scenes1-5.webp', alt: '阁楼油灯夜',
        lines: [
            { who: 'mother', text: '今天房东又来催租了。我说月底一定凑齐——拿什么凑，我心里也没底。' },
            { who: 'father', text: '……我明天去码头问问，那些卸货的工头要不要人手。' },
            { who: 'father', text: '世道变了，人就得跟着变。写字换不来米，扛麻袋至少能换一顿。' }
        ]
    },
    {
        chapter: '第三幕 · 撑', tag: '杭州阁楼 · 油灯夜',
        img: 'prologue/assets/bg/scenes2-1.webp', alt: '母亲操持',
        lines: [
            { who: 'narration', text: '你没完全听懂他们在说什么。但你记住了母亲那时的表情——她没叹气，也没掉眼泪，只是把作业本翻了一页，继续批改。' },
            { who: 'narration', text: '很多年后你才明白，那是一种叫作"撑"的神情。' }
        ]
    },
    {
        chapter: '第三幕 · 旧时代的尾巴', tag: '杭州阁楼 · 一九五〇年代',
        img: 'prologue/assets/bg/scenes3-1.webp', alt: '阁楼米缸',
        lines: [
            { who: 'narration', text: '旧时代的尾巴，扫到了这个家。祖辈做过官，到父亲这一代，只剩下一份体面却挣不到钱的差事——很快，连这份差事也没了。' },
            { who: 'narration', text: '母亲在小学教书，一份微薄的工资，要喂饱五张嘴。' },
            { who: 'narration', text: '很多年后你才明白，有些人的起点，是另一些人拼尽全力也够不到的天花板。' }
        ]
    },
    {
        chapter: '第四幕 · 街头巷口', tag: '巷口 · 一九五〇年代',
        img: 'prologue/assets/bg/scenes4-1.webp', alt: '街头巷口',
        lines: [
            { who: 'narration', text: '你几乎是从学会走路开始，就知道了"力气"两个字的分量。' },
            { who: 'narration', text: '七八岁，别家的孩子还在巷子里拍洋片、滚铁环，你已经蹲在门口，守着那口铁锅，把生米炒成喷香的炒米。一毛钱一包，用旧报纸卷成漏斗状，装满，递出去。' },
            { who: 'narration', text: '冬天的时候，风从巷口灌进来，吹得煤炉的火苗东倒西歪。你的手背上长满了冻疮，裂开的口子渗着血丝，但铁铲不能停——停下来，锅就凉了，米就不响了。' },
            { who: 'narration', text: '不止炒米，红薯、馒头所有能用来补贴家用的东西，你都卖过。你没有问过"为什么"，因为巷子里的孩子大都如此。穷，在这个年代不是什么秘密，是常态。' }
        ]
    },
    {
        chapter: '第五幕 · 师范学校门口', tag: '师范学校门口 · 一九六〇年代',
        img: 'prologue/assets/bg/scenes5-1.webp', alt: '师范学校门口',
        lines: [
            { who: 'narration', text: '初中毕业那年，你偷偷报考了一所不收学费的师范学校。你不敢跟家里说，怕万一考不上，白高兴一场。通知书寄到的那天，你一个人跑到巷子外面的邮筒前，看了三遍，才敢拆开。' }
        ]
    },
    {
        chapter: '第五幕 · 录取的喜悦', tag: '师范学校门口 · 一九六〇年代',
        img: 'prologue/assets/bg/scenes5-2.webp', alt: '录取报喜',
        lines: [
            { who: 'narration', text: '录取了。上面写得很清楚：免学费，每月还有津贴。你站在邮筒前面，眼泪差点掉下来——不是难过，是高兴。你想，终于有一条路，可以不靠家里就能走下去。' },
            { who: 'narration', text: '但高兴只持续了三天。' }
        ]
    },
    {
        chapter: '第五幕 · 成分核查', tag: '居委会 · 一九六〇年代',
        img: 'prologue/assets/bg/scenes6-1.webp', alt: '成分核查',
        lines: [
            { who: 'narration', text: '居委会来人核查家庭成分。你第一次见到那些表格——上面写着祖父的旧职、父亲的履历、家庭的社会关系。你看着办事员的笔在"出身"一栏里写下那几个字，像盖章一样，没有一丝犹豫。' },
            { who: 'narration', text: '"不符合条件。这个名额，给不了你。"' },
            { who: 'narration', text: '那句话是说出来的，但你记得它的声音不是从耳朵进去的，是从后背进去的——像有人在你脊梁骨上拍了一块冰。' },
            { who: 'narration', text: '你没有争辩。你只是在想，原来"成分"不是一张纸上的几个字，是一道门。你走不到门的另一边，不是因为腿不够长，是因为你姓那个姓。' }
        ]
    },
    {
        chapter: '第五幕 · 阁楼', tag: '杭州阁楼 · 一九六〇年代',
        img: 'prologue/assets/bg/scenes6-2.webp', alt: '烧掉通知书',
        lines: [
            { who: 'narration', text: '回到家，你把自己关在阁楼里，把那封通知书摊在桌上看了很久。母亲在门外站了一会儿，没有敲门，后来你听见她轻手轻脚地走开了。' },
            { who: 'narration', text: '那天晚上，你把通知书烧了。灰烬落在搪瓷盆里，打着旋，最后变成一小撮黑色的粉末。你伸手摸了摸，还是温热的。那一刻你对自己说：往后，别再指望任何一张纸能改变你的命。' }
        ]
    },
    {
        chapter: '第六幕 · 巷口', tag: '巷口 · 一九六〇年代',
        img: 'prologue/assets/bg/scenes7-1.webp', alt: '巷口 · 王婶通告',
        lines: [
            { who: 'narration', text: '又过了两年。你不再做小买卖了，长成了大人，开始找临时的零工——码头卸货、建筑工地运砖、印刷厂搬纸。每一份工都干不长，不是因为你吃不了苦，是因为"成分"两个字总是追着你不放。招工的人一看表格，就摆摆手："再等等吧。"' },
            { who: 'narration', text: '但日子没有停。你每天照常天亮出门，天黑回来，把挣来的钱分成两份——一份交到母亲的瓷罐里，一份留着自己明天的饭钱。你不再抱怨，也不再去想"凭什么"。' },
            { who: 'narration', text: '那天下午，你正在门口劈柴，王婶从巷子那头小跑过来，气还没喘匀，就把一张通告塞到你手里。' },
            { who: 'narration', text: '"舟山马目农场，招收知识青年，不论家庭成分。"' },
            { who: 'narration', text: '你低头看着那行字，看了很久。纸是普通的油印纸，带着淡淡的油墨味，右下角盖着一个红章。' }
        ]
    },
    {
        chapter: '第六幕 · 去', tag: '巷口 · 一九六〇年代',
        img: 'prologue/assets/bg/scenes7-2.webp', alt: '母亲看通告',
        lines: [
            { who: 'narration', text: '母亲正坐在窗边批改作业，你把通告递给她。她低头看完，把通告折好，什么也没说。你看着她，只说了一个字：' },
            { who: 'you', text: '去。' }
        ]
    },
    {
        chapter: '第七幕 · 马目农场', tag: '舟山 · 马目农场 · 大门',
        img: 'prologue/assets/bg/scenes7-3.webp', alt: '马目农场大门',
        lines: [
            { who: 'guide', text: '到了啊。这就是马目农场——从前关犯人的地方。你们这批人，往后就住这儿了。' },
            { who: 'guide', text: "别指望这儿跟你们城里家一样。没电，没自来水，没热乎饭等着你。吃饭靠自己动手，睡觉靠自己收拾。想走的趁早说，我让卡车捎你回去——但回去之后，你那份'下乡'的章，可就盖不上了。" },
            { who: 'tallboy', text: '……这儿有地方洗澡么？' },
            { who: 'guide', text: '有。河。水是咸的。洗多了身上起白碱——习惯了就好。' },
            { who: 'narration', text: '同乡青年阿海凑到你旁边，压低声音，语气里带着一种强撑出来的轻松' },
            { who: 'ahai', text: '哥们儿，你听见没？咸水洗澡……咱这是来当知青还是来腌咸菜啊？' },
            { who: 'narration', text: '阿海说完自己先笑了，但笑容没到眼底。他不安地换着脚的重心，攥着行李袋的带子，指节发白。' },
            { who: 'you', text: '来都来了，说这些没用。' },
            { who: 'ahai', text: '（愣了一下）也是……也是。来了就得认。' }
        ]
    },
    {
        chapter: '第七幕 · 宿舍之夜', tag: '舟山 · 马目农场 · 宿舍',
        img: 'prologue/assets/bg/scenes7-5.webp', alt: '农场宿舍',
        lines: [
            { who: 'guide', text: '跟我进来吧。先带你们去宿舍——棚子，不是房子。砖不够用，顶上铺的是油毡。漏雨是常事，自己拿桶接着就行。' },
            { who: 'narration', text: '就在这时，一个穿旧军装的中年男人从一间稍大的平房里走出来，叉着腰站定。他皮肤黝黑粗糙，颧骨高，眼神有一种常年管人练出来的压迫感。他没说话，先点了一支烟，抽了两口，才开口。' },
            { who: 'captain', text: '我是陈建国，你们喊我陈队长就行。话我只说一遍——到了这里，以前是什么出身、什么成分，我不管。但在我这儿，没有"干不完"三个字，只有"想不想干"。' },
            { who: 'captain', text: '干得好的，评先进、加工分、将来返城推荐，都有你一份。干得不好的——我丑话说在前头——扣口粮、没休假、档案上留下记录。你自己掂量。' },
            { who: 'captain', text: '今天先收拾住处。明天早上四点，场部门口集合。迟到的人，早饭减半。' },
            { who: 'ahai', text: '……四点？天都没亮吧？' },
            { who: 'you', text: '走吧，先找铺位。' },
            { who: 'narration', text: '你们沿着土路走向宿舍区。所谓的"宿舍"是一排低矮的土坯房，屋顶铺着油毡，用石头压住边缘。门是几块木板拼成的，关不严实，缝隙里灌着风。你推开其中一间的门，里面空荡荡的，地上铺着一层干稻草，墙角的泥地上有老鼠啃过的痕迹。' },
            { who: 'narration', text: '阿海抬起头，盯着对面的土墙，忽然开口，语气里的那层轻松已经彻底剥掉了。' },
            { who: 'ahai', text: '我本来……我本来想去当兵的。体检都过了，说我个子矮了半公分，刷下来了。我哥说，那你下乡吧，好歹是个去处。我就来了。' },
            { who: 'ahai', text: '你呢？你又是为啥来的？' },
            {
                choice: {
                    prompt: '（你怎么回答？）',
                    options: [
                        { key: 'A', label: '义无反顾', text: '别的路都堵死了，这条路，我认了。', effects: { resilience: 10, ahai_bond: 5 }, sound: 'prologue/assets/bgm/test5(short).mp3' },
                        { key: 'B', label: '犹豫但是报名', text: '至少……这是一条能走通的路。', effects: { resilience: 5 }, sound: '' },
                        { key: 'C', label: '抱怨着报名', text: '凭什么我们这种出身，只能捡剩下的路走？', effects: { resilience: 5, father_bond: 5 }, sound: 'prologue/assets/bgm/test4(short).mp3' }
                    ]
                }
            },
            { who: 'ahai', text: '（听完你的回答，愣了一会儿）……行。那我也不问了。反正来都来了，咱俩就互相罩着吧。' },
            { who: 'ahai', text: '说真的，你这人说话挺让人放心的。起码你知道自己为啥来。' },
            { who: 'narration', text: "这是你和阿海认识的第一天。你18岁，他还不到17。你们各自带着不同的答案，走进了同一扇铁门。你们都不知道，这份'互相罩着'的承诺，会在几个月后被真正考验。" }
        ]
    },
    {
        chapter: '第八幕 · 围垦滩涂', tag: '马目农场 · 围垦滩涂',
        img: 'prologue/assets/bg/scenes7-4.webp', alt: '围垦滩涂',
        lines: [
            { who: 'narration', text: '阿海挑着一担土从你身边经过，步子晃晃悠悠。筐里的土洒了一半出来，他停下来喘气，额头上全是汗。' },
            { who: 'ahai', text: '我算是明白了……就这半筐土，都能把我压趴下。你说这活儿，是人干的么。' },
            { who: 'you', text: '筐绳收短一截，重心就稳了。别跟它较劲。' },
            { who: 'ahai', text: '（试着把绳子收短，挑起走了两步，果然稳了不少，眉眼的褶子松开了些）……嘿，还真是。你打哪儿学来的这些？' },
            { who: 'you', text: '小时候扛米袋，扛出来的。' },
            { who: 'narration', text: '那天之后，你俩常常搭伙干活。你教阿海怎么省力，阿海负责在累到骨头发酸的时候，讲两个蹩脚的笑话，把那一口气岔开。日子就靠着这一点点的岔口，一天一天挨过去。' },
            { who: 'narration', text: '可活儿能熬，天不等人。入秋那场大潮，一夜之间，把辛辛苦苦围了大半年的棉田泡了个干净。海水退下去，地皮上结了一层白碱，像被人撒了一把盐。' },
            { who: 'narration', text: '队里半年的收成，全泡了汤。连最要紧的口粮，都开始紧着发。' },
            { who: 'narration', text: '夜里，宿舍里的鼾声比从前少了，翻身的动静却多了。没人开口，可每个人心里都明白——有什么东西，正在一块儿一块儿地往下塌。' }
        ]
    },
    {
        chapter: '第九幕 · 深夜的宿舍', tag: '马目农场 · 深夜',
        img: 'prologue/assets/bg/scenes7-5.webp', alt: '深夜宿舍',
        lines: [
            { who: 'ahai', text: '……你睡了没？' },
            { who: 'you', text: '没。' },
            { who: 'ahai', text: '我撑不住了。我想跟家里说，我要回去。哪怕回去挨骂，也比在这儿看不到头强。' },
            { who: 'ahai', text: '（从贴身的衣袋里，摸出一张皱巴巴的全家福，手抖得厉害）你看……我娘，我哥……我娘每回写信都问我，啥时候回去。我……我是不是，特别没出息？' },
            {
                choice: {
                    prompt: '（你如何回应，请选择）',
                    options: [
                        { key: 'A', label: '鼓励他坚持', text: '再撑一撑。这地方要熬出个人样，得先熬过这一关。', effects: { ahai_bond: 15 }, flags: { ahai_stay: true }, sound: 'prologue/assets/bgm/test5(short).mp3' },
                        { key: 'B', label: '理解并支持他离开', text: '想清楚了就走吧，没人能替你扛这些。', effects: { ahai_bond: 5 }, flags: { ahai_leave: true }, sound: 'prologue/assets/bgm/test4(short).mp3' },
                        { key: 'C', label: '沉默，只递给他一支烟', text: '（什么也没说，只是摸出一支烟，递到阿海面前）', effects: { resilience: 5, ahai_bond: 10 }, sound: 'prologue/assets/bgm/test4(short).mp3' }
                    ],
                    after: {
                        A: [
                            { who: 'ahai', text: '（抹了把脸，勉强扯出一点笑）……行，行。我再撑撑。你小子，嘴上没个正经，关键时候倒是靠谱。' },
                            { who: 'you', text: '我不是嘴上没正经。我是真信，你能撑过去。' },
                            { who: 'narration', text: '那晚之后，阿海再没提过"回去"两个字。他把那张全家福重新贴身收好，收起从前那股咋咋呼呼的劲儿——话变少了，腰杆却渐渐挺直了。多年以后，当他成了你创业时第一个愿意跟着你蹬三轮的人，你偶尔还会想起这个晚上。' }
                        ],
                        B: [
                            { who: 'ahai', text: '（红着眼眶，用力点了点头）谢了。真的……谢了。' },
                            { who: 'narration', text: '三天后，阿海办好了手续。临走那天，他把那张全家福塞进你手里。' },
                            { who: 'ahai', text: '留个念想。等你也回去了，来找我。' },
                            { who: 'narration', text: '你点点头，把照片贴身收好。你后来再也没见过他——那句"来找我"，你也没能兑现。直到很多年后，一场你连想都没想过的发布会上，人群里有个一晃而过的背影，你觉得眼熟，再回头，已经找不见了。' }
                        ],
                        C: [
                            { who: 'narration', text: '那支烟，阿海接了，点上，抽了两口，呛得直咳嗽。咳完了，他反倒慢慢平静下来。那一夜，他没再说要走。可第二天起，他的话明显少了。你始终不知道，他最后是留了下来，还是在某个你没留神的清晨，悄悄办完了手续。' }
                        ]
                    }
                }
            }
        ]
    },
    {
        chapter: '第十幕 · 马目农场的第二年', tag: '马目农场 · 第二年',
        img: 'prologue/assets/bg/scenes7-6.webp', alt: '修坝挖沟',
        lines: [
            { who: 'narration', text: '那一年，你几乎是拼了命地干活。修坝、挖沟、挑土——别人干一分，你干三分。不是赌气，是你渐渐想明白了一个道理：在这片看不见头的地方，力气是唯一不会骗你的东西。' },
            { who: 'captain', text: '（难得地在收工后叫住你，叉着腰，语气平平的）……你，对，就是你。上头要评"舟山地区上山下乡积极分子"，咱们场有一个名额。我报的是你。' },
            { who: 'captain', text: '别高兴太早。不是因为你干活最猛——干活猛的人多了去了。是因为我看了你一年，你小子，从不叫苦，也不偷奸耍滑。这样的人，放哪儿都差不了。' },
            { who: 'narration', text: '这是陈队长头一回跟你说了这么多话。也是你活了这些年，头一回有人正正经经地告诉你：你行。那张奖状，你后来一直留着——那是你人生里第一件，完全靠自己挣来的东西。' },
            { who: 'narration', text: '又过了些日子，场部收缩，你们这批知青要往绍兴的茶场转。走那天，陈队长没来送，只托人捎了一句话。' },
            { who: 'messenger', text: '陈队长说——到了那边，别学那些人混日子。没人看着你的时候，最能看出一个人的成色。' },
            { who: 'narration', text: '你笑了笑，把这句话连同那张奖状，一起收进了行李最底下。你当时只当是一句临别的话。没想到三个月后，陈队长也被调到了绍兴——据说上头觉得，他带你们这批人，最压得住阵。' }
        ]
    },
    {
        chapter: '第十一幕 · 绍兴茶场', tag: '绍兴 · 茶场 · 初到',
        img: 'prologue/assets/bg/scenes7-7.webp', alt: '绍兴茶场',
        lines: [
            { who: 'narration', text: '绍兴的茶场，比马目多了一样东西——绿色。满山满坡的茶园，春天的时候，绿得晃眼。' },
            { who: 'narration', text: '可绿是绿，活照样是苦的。种茶、采茶、割稻、造地、开山、打石——你几乎把这世上能想到的力气活，都在这一片山上干了个遍。农忙时节，挑着两百斤的担子走十几里山路，肩膀磨破了一层，结了痂，再磨破一层。' },
            { who: 'narration', text: '在这里，你不再数日子了。日子太多，数不过来。你只记得四季轮着转：春采茶，夏锄草，秋割稻，冬垦荒。一晃，就是好几年。' },
            { who: 'narration', text: '唯一没变的，是行李底下那本《毛选》。白天翻得卷了边，夜里就着油灯，还能再读一页。你没读出什么惊天动地的大道理，只记住了一件事：凡事得靠自己动脑子——光靠熬，熬不出头。' },
            { if: 'ahai_stay', who: 'narration', text: '阿海跟你在同一座茶场。他话少了很多，可你挑担子的时候，总有人从后头接上一肩。' }
        ]
    },
    {
        chapter: '第十二幕 · 田头', tag: '绍兴茶场 · 田头',
        img: 'prologue/assets/bg/scenes7-8.webp', alt: '稻田收割',
        lines: [
            { who: 'captain', text: '这批稻子，今天必须割完。割不完，晚饭别想吃。' },
            {
                choice: {
                    prompt: '（你如何应对，请选择）',
                    options: [
                        { key: 'A', label: '硬扛，不抱怨', text: '割就割。饭晚点吃，没什么大不了。', effects: { resilience: 15 }, sound: 'prologue/assets/bgm/test5(short).mp3' },
                        { key: 'B', label: '据理力争', text: '队长，这个量，一个人从天亮干到天黑也割不完。活儿不是不能干——可总得让人分得清，是真有急事，还是存心磨人。加两个人手，我保证明天前交差。', effects: { resilience: 5, negotiation_skill: 10 }, sound: 'prologue/assets/bgm/test4(short).mp3' },
                        { key: 'C', label: '心里应付了事', text: '……行吧。（嘴上应着，心里却打定了主意，割个差不多就算）', effects: { resilience: -5 }, sound: 'prologue/assets/bgm/test4(short).mp3' }
                    ],
                    after: {
                        A: [
                            { who: 'narration', text: '你硬是割到了后半夜，镰刀在手指上磨出了血泡。第二天，老陈没再提这件事，只在路过你身边时，低低撂下一句："……还行。"' }
                        ],
                        B: [
                            { who: 'captain', text: '（皱眉，沉默了片刻）……行。老周，你带两个人过去，帮他一把。' },
                            { who: 'narration', text: '这是你头一回发现——敢开口要条件的人，未必吃亏。你把这个发现，悄悄记在了心里。那个叫"谈判"的本事，从此在你身上扎了根，往后许多年，它会在你最要紧的那几步路里，替你开出价来。' }
                        ],
                        C: [
                            { who: 'narration', text: '你那天果然没割完，晚饭也确实是凉的。可最凉的不是饭，是你头一回发现，"差不多就行"这四个字，会让人心里发虚一整个晚上。第二天你补了一整天的工，才把那份心虚填平。' }
                        ]
                    }
                }
            }
        ]
    },
    {
        chapter: '第十三幕 · 傍晚的田埂', tag: '绍兴茶场 · 傍晚',
        img: 'prologue/assets/bg/scenes7-9.webp', alt: '赵伯抽烟',
        lines: [
            { who: 'narration', text: '有一阵子，你整个人像被抽空了一样。不是累——是说不清道不明的一种空。话懒得说，活提不起劲，连天亮了天黑了你都觉得没差。' },
            { who: 'zhaobo', text: '（头也没抬，慢悠悠地开口）年轻人，愁眉苦脸地干活，跟乐呵呵地干活，累的程度是一样的。你说，那图个啥？' },
            { who: 'you', text: '（愣了一下）……那还能图个啥。' },
            { who: 'zhaobo', text: '我在这片地上待了三十年，见过的人——能干成事的，往往不是最聪明的那个，是最不嫌麻烦、肯把一件事做到底的那个。' },
            { who: 'zhaobo', text: '你别嫌我老头子话多。往后你就懂了：这世上的路啊，看着有千万条，其实轮到你自个儿走的，就一条。把它走通喽，就什么都有了。' },
            { who: 'narration', text: '你当时没全听懂。但这句话像一颗种子，被赵伯随手埋进了土里。要等很多年以后，当你站在闹哄哄的市场上，决定把一桩小生意做到头的那一刻，它才会重新发芽。' }
        ]
    },
    {
        chapter: '第十四幕 · 晌午 · 一碗热水', tag: '绍兴茶场 · 晌午',
        img: 'prologue/assets/bg/scenes7-10.webp', alt: '秀兰送水',
        lines: [
            { who: 'narration', text: '秀兰是这茶场里另一个话不多的人。可她的不多话，跟你的不多话不一样——你不说话，是习惯；她不多话，是把话都做进了活里。' },
            { who: 'xiulan', text: '（把那碗热水递到你手里）听说你们那批人里，就你一个，从没喊过一句苦。' },
            { who: 'you', text: '喊苦有什么用。喊了，活照样得干。' },
            { who: 'xiulan', text: '（点点头，像是很认可）我娘也常说，日子是过出来的，不是想出来的。' },
            { who: 'you', text: '……你娘是个明白人。' },
            { who: 'narration', text: '你们没说上几句话。可从那以后，你手里那碗水，总是热的。' }
        ]
    },
    {
        chapter: '第十四幕 · 晌午 · 秧苗', tag: '绍兴茶场 · 晌午',
        img: 'prologue/assets/bg/scenes7-11.webp', alt: '梯田插秧',
        lines: [
            { who: 'xiulan', text: '（一边插秧，一边像随口那么一提）我家里，本来给我说了一门亲事。下乡这一耽搁……也不知道那家人，还等不等。' },
            { who: 'you', text: '等不等，是他们的事。你自己还想不想等，才是你自己的事。' },
            { who: 'xiulan', text: '（愣了愣，随即低下头笑了）……你这人，讲话怪好听的。' },
            { who: 'narration', text: '这话接得没头没尾，可两个人都听懂了。那天之后，一块儿干活的时候，你们中间隔的那几行秧苗，好像不知不觉，窄了几分。' }
        ]
    },
    {
        chapter: '第十五幕 · 一九七七年', tag: '绍兴茶场 · 一九七七年',
        img: 'prologue/assets/bg/scenes7-12.webp', alt: '新打家具',
        lines: [
            { who: 'narration', text: '一晃，你在这茶场已经待了十几年。1977年，你32岁。三个弟弟先后回了杭州，安了家，成了业。只有你，还留在这片茶山上，看不到头。' },
            { who: 'narration', text: '那年冬天，家里托人捎来一套新打的家具。大弟做的木工，二弟上的漆，桌角还细细地刻着一对鸳鸯。一家人一个字也没写——可那套家具本身，就是一封长长的信：该成家了。' },
            { who: 'xiulan', text: '（看着那套家具，半开玩笑，半认真）你家里这是……在给咱俩，指一条明路啊。' },
            { who: 'you', text: '路是明摆着的。就看愿不愿意，一起走。' },
            { who: 'xiulan', text: '（没接话，只低下头，指尖轻轻摸了摸桌角那对鸳鸯，过了好一会儿，才极轻地应了一声）……嗯。' },
            { who: 'narration', text: '这是你在漫长得望不到头的苦日子里，为数不多觉得"值了"的一刻。你几乎要以为，日子就会这么着，在这片茶山上，安安静静地过下去了。' }
        ]
    },
    {
        chapter: '第十六幕 · 回城通告', tag: '绍兴茶场 · 一九七八年',
        img: 'prologue/assets/bg/scenes7-13.webp', alt: '场部通告',
        lines: [
            { who: 'narration', text: '你没想到，转机会在第二年，突然降临。' },
            { who: 'narration', text: '1978年初春，一张比当年更薄、字却更大的通告，贴在了场部墙上——城镇知识青年，可办理回城。' },
            { who: 'narration', text: '这一次，你没有把它看三遍。你只盯着那行字，忽然想起十几年前，自己揣着另一张薄纸、站在巷口时的那个下午。当年你走，是因为这世道终于给你留了一道缝；如今你回，是因为那道缝的另一头，有人在等你。' }
        ]
    },
    {
        chapter: '第十六幕 · 道别', tag: '绍兴茶场 · 一九七八年',
        img: 'prologue/assets/bg/scenes8-1.webp', alt: '离开茶场',
        lines: [
            { who: 'narration', text: '办手续那天，你去向赵伯道别。赵伯还是蹲在老地方卷旱烟，听完，只点了点头。' },
            { who: 'zhaobo', text: '我说过——肯把一件事做到底的人，差不了。你这一走，是要去做一件更大的事了。去吧。' },
            { who: 'narration', text: '秀兰来送你，没多话，只把一包自己炒的茶叶塞进你包里。' },
            { who: 'xiulan', text: '路上解乏。' },
            { who: 'captain', text: '（车快开时，他难得地走到你跟前，声音压得很低）……回去以后，别把在这儿学会的东西弄丢了。' },
            { who: 'you', text: '什么东西？' },
            { who: 'captain', text: '扛。' },
            { who: 'narration', text: '你怔了怔，随即笑了。车开出很远，你回头，还能看见他站在土路上，像一根钉进地里多年的桩。' },
            { if: 'ahai_stay', who: 'narration', text: '人群里，阿海朝你用力挥了挥手，笑得眼眶发红，什么也没说。' }
        ]
    },
    {
        chapter: '第十七幕 · 杭州老街', tag: '杭州 · 一九七八年',
        img: 'prologue/assets/bg/scenes8-2.webp', alt: '杭州雨巷',
        lines: [
            { who: 'narration', text: '1978年，你33岁，回到了杭州。母亲在校门口等你——她老了，可走路还是那么快，风风火火的，像是还在跟时间赛跑。' },
            { who: 'mother', text: '回来就好。我那位置……退了。你接上吧。好歹是个正经饭碗，饿不死人。' },
            { who: 'narration', text: '你接过母亲的班，进了那所小学，做了校办纸箱厂的工人。没有人觉得，一个三十三岁才回城的人能有什么出息。连你自己，也这么以为。' },
            { who: 'narration', text: '可每到夜深，你躺在阁楼的床上，还会想起赵伯那句话——"能把一件事做到底的人，差不了。"也会想起陈队长那个字——扛。' },
            { who: 'narration', text: '你并不知道，命运留给你的那张底牌，就压在九年后的杭州上城区——一间连年亏损、门脸破旧的校办经销部里，等你亲手去翻开。' }
        ]
    }
];

/* =====================================================================
 * 序章拆成 5 段，穿插在主线的前几次推进里播放，而不是"查看第一份简历"
 * 一次性看完 29 幕。第一段仍然挂在"查看第一份简历"这个交互上（看完
 * 才能雇农场帮手）；后面几段分别接在序章→代销小摊→承包谈判→广告豪赌
 * 这几次主线推进之后自动播放（见 22-main-story.js 的 prologuePartAfter）。
 * ===================================================================== */
const PROLOGUE_PARTS = [
    { from: 0, to: 9, onDone: 'resume' },                    /* 童年·家道中落 —— 查看第一份简历 */
    { from: 9, to: 15, onDone: 'flashback' },                /* 成分与抉择 —— 序章推进到代销小摊时 */
    { from: 15, to: 20, onDone: 'flashback' },               /* 马目农场 —— 代销小摊推进到承包谈判时 */
    { from: 20, to: 26, onDone: 'flashback' },               /* 绍兴茶场 —— 承包谈判推进到广告豪赌时 */
    { from: 26, to: 29, onDone: 'flashback', final: true }   /* 回城 —— 广告豪赌推进到兼并国企时 */
];

/* =====================================================================
 * 引擎（原样搬过来，只是把 DOM 查询换成新的 id，收尾从 postMessage
 * 换成直接调用 completeFarmResumeStory；另外原来是整段 29 幕一口气播完，
 * 现在按 PROLOGUE_PARTS 分段播放，pgScene 是"当前段内"的相对下标）
 * ===================================================================== */
const prologuePanel = document.getElementById('prologuePanel');
const prologueLineEl = document.getElementById('prologueLine');
const prologueHintEl = document.getElementById('prologueHint');
const prologueSpeakerEl = document.getElementById('prologueSpeaker');
const prologueBgEl = document.getElementById('prologueBg');
const prologueSceneTagEl = document.getElementById('prologueSceneTag');
const prologueStackEl = document.getElementById('prologueBgStack');
const prologueChoicesBox = document.getElementById('prologueChoicesBox');
const prologueChoicesTitle = document.getElementById('prologueChoicesTitle');
const prologueChoicesList = document.getElementById('prologueChoicesList');
const prologueHudStats = document.getElementById('prologueHudStats');
const prologueToastEl = document.getElementById('prologueToast');
const prologueBgm = document.getElementById('prologueBgm');
const prologueMusicBtn = document.getElementById('prologueMusicBtn');
const prologueSkipBtn = document.getElementById('prologueSkipBtn');

let pgScene = 0;
let pgIdx = -1;
let pgTyping = false;
let pgFinished = false;
let pgSwitching = false;
let pgTimer = null;
let pgStream = null;
let pgPendingChoice = null;
let pgChoiceIdx = -1;
let pgMusicOn = false;
let pgToastTimer = null;
let pgActive = false;
let pgPartIdx = 0;
let pgActiveScenes = [];

const prologueState = {
    stats: { resilience: 0, ahai_bond: 0, negotiation_skill: 0, father_bond: 0 },
    flags: {},
    partsDone: {},
    completed: false
};

function pgCurrentPart() { return PROLOGUE_PARTS[pgPartIdx] || PROLOGUE_PARTS[0]; }

function pgGetLines() { return pgStream; }

function pgSetStream() {
    pgStream = pgActiveScenes[pgScene].lines.filter(l => !l.if || prologueState.flags[l.if]);
}

function pgTypeLine(l) {
    const full = l.text;
    let pos = 0;
    pgTyping = true;
    pgSetSpeaker(l.who);
    prologueLineEl.classList.toggle('action', full.charAt(0) === '（');
    prologueHintEl.style.visibility = 'hidden';
    prologueLineEl.textContent = '';
    clearInterval(pgTimer);
    pgTimer = setInterval(() => {
        pos++;
        prologueLineEl.textContent = full.slice(0, pos);
        if (pos < full.length) {
            const caret = document.createElement('span');
            caret.className = 'caret';
            prologueLineEl.appendChild(caret);
        }
        if (pos >= full.length) {
            clearInterval(pgTimer);
            pgTyping = false;
            if (pgIdx === pgGetLines().length - 1) { pgFinished = true; pgSetEndHint(); }
            prologueHintEl.style.visibility = 'visible';
        }
    }, 55);
}

function pgFinishLine() {
    const ls = pgGetLines();
    if (pgIdx < 0 || pgIdx >= ls.length) return;
    clearInterval(pgTimer);
    prologueLineEl.textContent = ls[pgIdx].text;
    pgTyping = false;
    if (pgIdx === ls.length - 1) { pgFinished = true; pgSetEndHint(); }
    prologueHintEl.style.visibility = 'visible';
}

function pgSetSpeaker(who) {
    prologueSpeakerEl.textContent = PROLOGUE_WHO_NAME[who] || PROLOGUE_WHO_NAME.narration;
    prologueSpeakerEl.className = 'pro-speaker' + (who === 'narration' ? '' : ' ' + who);
}

function pgSetEndHint() {
    if (pgScene === pgActiveScenes.length - 1) {
        const part = pgCurrentPart();
        prologueHintEl.textContent = part.final ? '序章 · 完 —— 下一篇：代销小摊' : '（这段回忆先到这儿）';
        prologueHintEl.classList.add('done');
        pgFinishPart();
    } else {
        prologueHintEl.textContent = '▼ 进入下一幕';
        prologueHintEl.classList.remove('done');
    }
}

function pgRenderHud() {
    let html = '';
    PROLOGUE_STAT_ORDER.forEach(k => {
        html += '<div class="pro-hud-row"><span>' + PROLOGUE_STAT_NAME[k] + '</span><b>' + prologueState.stats[k] + '</b></div>';
    });
    prologueHudStats.innerHTML = html;
}

function pgApplyEffects(effects) {
    if (!effects) return;
    Object.keys(effects).forEach(k => {
        if (k in prologueState.stats) prologueState.stats[k] += effects[k];
    });
    pgRenderHud();
}

function pgToastEffects(effects) {
    if (!effects) return;
    const parts = [];
    Object.keys(effects).forEach(k => {
        if (!(k in PROLOGUE_STAT_NAME)) return;
        const v = effects[k];
        parts.push((v > 0 ? '+' : '') + v + ' ' + PROLOGUE_STAT_NAME[k]);
    });
    if (parts.length) pgToast(parts.join(' · '));
}

function pgToast(msg) {
    prologueToastEl.textContent = msg;
    prologueToastEl.classList.add('show');
    clearTimeout(pgToastTimer);
    pgToastTimer = setTimeout(() => prologueToastEl.classList.remove('show'), 2200);
}

function pgPlaySfx(path) {
    if (!path) return;
    try {
        const a = new Audio(path);
        a.volume = 0.6;
        a.play().catch(() => { });
    } catch (e) { }
}

function pgShowChoices(c) {
    pgPendingChoice = c;
    pgChoiceIdx = pgIdx;
    prologueChoicesTitle.textContent = c.prompt;
    prologueChoicesList.innerHTML = '';
    c.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pro-choice';
        btn.textContent = opt.label;
        btn.addEventListener('click', ev => {
            ev.stopPropagation();
            pgPlaySfx(opt.sound);
            pgPickChoice(opt.key);
        });
        prologueChoicesList.appendChild(btn);
    });
    prologueChoicesBox.hidden = false;
    prologuePanel.classList.add('has-stats');
    pgRenderHud();
}

function pgPickChoice(key) {
    const c = pgPendingChoice;
    if (!c) return;
    const opt = c.options.find(o => o.key === key);
    pgPendingChoice = null;
    prologueChoicesBox.hidden = true;

    pgApplyEffects(opt.effects);
    pgToastEffects(opt.effects);
    Object.assign(prologueState.flags, opt.flags || {});

    const follow = [];
    if (opt.text) follow.push({ who: 'you', text: opt.text });
    if (c.after && c.after[key]) {
        follow.push.apply(follow, c.after[key]);
    } else {
        follow.push.apply(follow, pgGetLines().slice(pgChoiceIdx + 1));
    }

    pgStream = follow;
    pgIdx = -1; pgTyping = false; pgFinished = false;
    prologueHintEl.classList.remove('done');
    prologueHintEl.style.visibility = 'visible';
    pgAdvance();
    if (typeof saveGameState === 'function') saveGameState(false);
}

function pgAdvance() {
    if (!pgActive) return;
    if (pgSwitching) return;
    if (pgPendingChoice) return;
    if (pgFinished) {
        if (pgScene < PROLOGUE_SCENES.length - 1) pgSwitchScene();
        return;
    }
    if (pgTyping) { pgFinishLine(); return; }
    if (pgIdx < pgGetLines().length - 1) {
        pgIdx++;
        const l = pgGetLines()[pgIdx];
        if (l.choice) { pgShowChoices(l.choice); return; }
        pgTypeLine(l);
    }
}

function pgPreloadNext() {
    if (pgScene + 1 < pgActiveScenes.length) {
        const im = new Image();
        im.src = pgActiveScenes[pgScene + 1].img;
    }
}

function pgSwitchScene() {
    if (pgSwitching) return;
    if (pgScene >= pgActiveScenes.length - 1) return;
    pgSwitching = true;
    pgScene++;
    const S = pgActiveScenes[pgScene];
    prologueStackEl.style.opacity = '0';
    setTimeout(() => {
        prologueBgEl.src = S.img;
        prologueBgEl.alt = S.alt;
        prologueSceneTagEl.textContent = S.tag;
        pgSetStream();
        pgIdx = -1; pgTyping = false; pgFinished = false;
        prologueHintEl.classList.remove('done');
        prologueHintEl.textContent = '▼ 点击继续';
        prologueHintEl.style.visibility = 'visible';
        prologueStackEl.style.opacity = '1';
        prologueSceneTagEl.classList.remove('anim');
        void prologueSceneTagEl.offsetWidth;
        prologueSceneTagEl.classList.add('anim');
        pgPreloadNext();
        setTimeout(() => { pgSwitching = false; pgAdvance(); }, 1100);
    }, 600);
}

function pgToggleMusic() {
    if (pgMusicOn) {
        prologueBgm.pause();
        return;
    }
    prologueBgm.play().catch(() => {
        pgMusicOn = false;
        prologueMusicBtn.classList.remove('is-on');
    });
}

if (prologueBgm) {
    prologueBgm.addEventListener('error', () => {
        pgMusicOn = false;
        if (prologueMusicBtn) prologueMusicBtn.classList.remove('is-on');
    });
    prologueBgm.addEventListener('playing', () => {
        pgMusicOn = true;
        if (prologueMusicBtn) prologueMusicBtn.classList.add('is-on');
    });
    prologueBgm.addEventListener('pause', () => {
        pgMusicOn = false;
        if (prologueMusicBtn) prologueMusicBtn.classList.remove('is-on');
    });
}
if (prologueMusicBtn) {
    prologueMusicBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        pgToggleMusic();
    });
}
if (prologueSkipBtn) {
    prologueSkipBtn.addEventListener('click', ev => {
        ev.stopPropagation();
        pgFinishPart();
    });
}
if (prologuePanel) {
    prologuePanel.addEventListener('click', () => pgAdvance());
}
addEventListener('keydown', event => {
    if (!prologuePanel || prologuePanel.hidden) return;
    const k = event.key.toLowerCase();
    if (k === ' ' || k === 'enter' || k === 'arrowdown' || k === 'arrowright' || k === 'z') {
        event.preventDefault();
        pgAdvance();
    }
    if (k === 'x') {
        event.preventDefault();
        if (pgTyping) pgFinishLine();
    }
    if (k === 'escape') {
        event.preventDefault();
        pgFinishPart();
    }
});

/* ---- 打开 / 收尾 ---- */

function openProloguePart(partIdx) {
    const part = PROLOGUE_PARTS[partIdx];
    if (!part || !prologuePanel) {
        if (partIdx === 0 && typeof completeFarmResumeStory === 'function') completeFarmResumeStory();
        return;
    }
    if (prologueState.partsDone[partIdx]) return;
    pgActive = true;
    pgPartIdx = partIdx;
    pgActiveScenes = PROLOGUE_SCENES.slice(part.from, part.to);
    pgScene = 0; pgIdx = -1; pgTyping = false; pgFinished = false; pgSwitching = false;
    pgPendingChoice = null;
    prologuePanel.classList.remove('has-stats');
    pgSetStream();
    const first = pgActiveScenes[0];
    prologueBgEl.src = first.img;
    prologueBgEl.alt = first.alt;
    prologueSceneTagEl.textContent = first.tag;
    prologueHintEl.textContent = '▼ 点击继续';
    prologueHintEl.classList.remove('done');
    pgRenderHud();
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    if (document.pointerLockElement) document.exitPointerLock();
    window.APP_SHELL_BLOCK_GAME = true;
    window.APP_GAME_MODAL_OPEN = true;
    prologuePanel.hidden = false;
    setTimeout(pgAdvance, 1600);
}

function openPrologue() {
    openProloguePart(0);
}

function pgFinishPart() {
    if (!pgActive) return;
    pgActive = false;
    clearInterval(pgTimer);
    if (prologueBgm) prologueBgm.pause();
    const part = pgCurrentPart();
    prologueState.partsDone[pgPartIdx] = true;
    if (part.final) prologueState.completed = true;
    if (prologuePanel) prologuePanel.hidden = true;
    if (typeof window.clearPlayerInputState === 'function') window.clearPlayerInputState();
    window.APP_SHELL_BLOCK_GAME = false;
    window.APP_GAME_MODAL_OPEN = false;
    if (part.onDone === 'resume' && typeof completeFarmResumeStory === 'function') {
        completeFarmResumeStory();
    } else if (typeof saveGameState === 'function') {
        saveGameState(false);
    }
}

window.openPrologue = openPrologue;
window.openProloguePart = openProloguePart;

function capturePrologueState() {
    return {
        stats: Object.assign({}, prologueState.stats),
        flags: Object.assign({}, prologueState.flags),
        partsDone: Object.assign({}, prologueState.partsDone),
        completed: !!prologueState.completed
    };
}

function applyPrologueState(raw) {
    if (raw && raw.stats && typeof raw.stats === 'object') {
        PROLOGUE_STAT_ORDER.forEach(k => {
            prologueState.stats[k] = Math.trunc(Number(raw.stats[k]) || 0);
        });
    }
    if (raw && raw.flags && typeof raw.flags === 'object') {
        prologueState.flags = Object.assign({}, raw.flags);
    }
    prologueState.partsDone = (raw && raw.partsDone && typeof raw.partsDone === 'object')
        ? Object.assign({}, raw.partsDone) : {};
    prologueState.completed = !!(raw && raw.completed);
}

window.capturePrologueState = capturePrologueState;
window.applyPrologueState = applyPrologueState;
