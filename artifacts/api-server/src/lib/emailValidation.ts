/**
 * Email validation utilities — catches temp emails, Gmail aliases, and
 * dot-trick duplicates.
 */

/**
 * Large list of known disposable / temporary email providers.
 * All lowercase, no leading dot.
 */
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com","10minutemail.net","10minutemail.org","10minutemail.de",
  "10minutemail.co.uk","10minutemail.info","10minutemail.us",
  "20minutemail.com","20minutemail.it","20minutemail.net",
  "33mail.com","tempmail.com","tempr.email","tempinbox.com","tempinbox.co.uk",
  "guerrillamail.com","guerrillamail.info","guerrillamail.biz","guerrillamail.de",
  "guerrillamail.net","guerrillamail.org","guerrillamailblock.com",
  "sharklasers.com","guerrillamailblock.com","grr.la","guerrillamail.org",
  "spam4.me","yopmail.com","yopmail.fr","cool.fr.nf","jetable.fr.nf",
  "nospam.ze.tc","nomail.xl.cx","mega.zik.dj","speed.1s.fr","courriel.fr.nf",
  "moncourrier.fr.nf","monemail.fr.nf","monmail.fr.nf",
  "mailnull.com","mailnull.net","spamgourmet.com","spamgourmet.net",
  "spamgourmet.org","spamgourmet.me","mailinator.com","mailinator.net",
  "mailinator.us","mailinator2.com","mailinator2.net","mailinater.com",
  "suremail.info","spamherelots.com","spamhereplease.com","emailias.com",
  "trashmail.at","trashmail.io","trashmail.me","trashmail.org","trashmail.net",
  "trashmail.com","trashmail.xyz","trashmail.ch","trashmail.de","trashmail.eu",
  "dispostable.com","throwam.com","throwam.net","throwam.org",
  "throwam.info","throwam.us","throwam.biz","throwam.co",
  "maildrop.cc","spambog.com","spambog.de","spambog.ru",
  "discard.email","discardmail.com","discardmail.de",
  "getairmail.com","fakeinbox.com","nwldx.com","armyspy.com","cuvox.de",
  "dayrep.com","einrot.com","fleckens.hu","gustr.com","jourrapide.com",
  "rhyta.com","superrito.com","teleworm.us","thetestingground.com",
  "dodgit.com","dodgit.org","mailme.lv","mailme.ro","mailme.ir",
  "spamfree24.org","spamfree24.de","spamfree24.eu","spamfree24.info",
  "spamfree24.net","spamfree.eu","jetable.net","jetable.com","jetable.org",
  "jetable.de","jetable.info","jetable.fr","jetable.me","jetable.biz",
  "noclickemail.com","fakemail.net","fakemailgenerator.com","fakemail.fr",
  "mailnesia.com","mailnull.com","spamgob.com","throwam.com","throwaway.email",
  "throwam.email","spamoff.de","spam.care","spam.la","spam.su","spam.st",
  "spam.site","spam.direct","spam.fyi","spam.ws","spambin.com",
  "nowmymail.com","nowmymail.net","rklips.com","fiifke.de","haqed.com",
  "koszmail.pl","cocodomain.com","mail7.io","inboxkitten.com",
  "mohmal.com","onetimeemail.net","spamex.com","mt2014.com","mt2015.com",
  "mt2016.com","mt2017.com","topranklist.de","disposableaddress.com",
  "tempsky.com","temporaryemail.net","temporaryemail.us","temporaryinbox.com",
  "temporamail.com","throwam.co","throwaway.email","throwam.us",
  "burnermail.io","mailtemp.org","maildrop.io","harakirimail.com",
  "wegwerfmail.de","wegwerfmail.net","wegwerfmail.org","wegwerfadresse.de",
  "wetrainbayarea.org","yotta.guru","zoemail.net","zoemail.org",
  "protonmail.com", // legitimate but sometimes misused — optional to keep
  "cock.li","airpost.net","6paq.com","ano-mail.net","anonbox.net",
  "anonmails.de","anonymbox.com","anonymousmail.org","anonymousness.com",
  "anonymize.com","ano.email","antispam.de","anti-spam.ro","bbusers.net",
  "beefmilk.com","binkmail.com","blahblah.dk","blahmailat.com","bofthew.com",
  "botmail.net","bouncr.com","broadbandninja.com","brickandmortar.org",
  "bsnow.net","bugmenot.com","bulkmail.xyz","bumpmail.io","burstmail.info",
  "byom.de","casualdx.com","cek.pm","cellurl.com","chammy.info",
  "chong-mail.net","cids.net","clandest.in","cleanmail.info","clixmail.net",
  "cloakmail.com","clrmail.com","clue-mail.com","cm-email.com",
  "cmail.net","cobalt.com.au","contactprivacy.com","cool-email.com",
  "coolsend.com","correo.blogos.net","cosmorph.com","courrieltemporaire.com",
  "crossroadsmail.com","cust.in","cutout.club","dacoolest.com",
  "dailymails.net","dandikmail.com","datafree.co","dayrep.com",
  "deadaddress.com","deadletter.ga","deagot.com","dealja.com","dealemail.com",
  "dingbone.com","dinkmail.com","dirtmail.ga","disappearing.xyz",
  "disposeamail.com","disposemail.com","dispostable.com","dmarc.ro",
  "doanart.com","dodgit.com","donemail.ru","dontreg.com","dontsendmeemail.com",
  "dotnot.com","dump-email.info","dumpandfuck.com","dumpemail.org",
  "dumpmail.de","dumpyemail.com","durandinterstellar.com","e4ward.com",
  "email60.com","emailage.cf","emailages.com","emaildienst.de",
  "emailfake.com","emailgo.de","emailigo.com","emailinfive.com",
  "emailisvalid.com","emailkid.com","emaillime.com","emailmiser.com",
  "emailnax.com","emailo.pro","emailout.com","emailproxsy.com",
  "emailque.com","emailsecret.net","emailsensei.com","emailspam.info",
  "emailtemporar.ro","emailthe.net","emailtmp.com","emailz.net",
  "emkei.cz","emkei.ga","emkei.gq","emkei.ml","emkei.cf","enterto.com",
  "ephemail.net","etranquil.com","etranquil.net","etranquil.org",
  "eventtempmail.com","everytg.ml","expressmail.dk","extrawelt.net",
  "ez.lv","ezagenda.com","f4k.es","fakemailz.com","falseaddress.com",
  "fan-tast-isch.de","fast-email.com","fast-mail.fr","fastacura.com",
  "fastchevy.com","fastchrysler.com","fastkawasaki.com","fastmazda.com",
  "fastnissan.com","fastsubaru.com","fasttoyota.com","fastwebnet.it",
  "fddns.ml","fightallspam.com","filzmail.com","fivemail.de",
  "fizmail.com","flur.me","flyingeaglemail.com","flyspam.com",
  "fortgates.net","fr.nf","fragatolotto.it","freemails.ga",
  "frontiernet.net","fuckingduh.com","fudgerub.com","fux0ringduh.com",
  "garbagemail.org","garliclife.com","gedmail.win","gehensiemirnicht.de",
  "genderfuck.net","get1mail.com","get2mail.fr","getairmail.com",
  "getmails.eu","getonemail.com","getonemail.net","gfcom.com",
  "ghosttexter.de","gift-link.com","gishpuppy.com","gmailnew.com",
  "gmaildottrick.com","gmailnator.com",  // fake gmail generators
  "goemailgo.com","gorillaswithdirtyarmpits.com","gotmail.com",
  "gotmail.net","gotmail.org","gowikicampus.com","gowikicar.com",
  "gowikicars.com","gowikihealth.com","gowikimail.com","gowikimarket.com",
  "gowikimedical.com","gowikinetwork.com","gowikiorg.com","gowikipedia.com",
  "gowikisearch.com","gowikisolution.com","grish.com","grr.la",
  "gsrv.co.uk","gustr.com","h.mintemail.com","h8s.org","hacccc.com",
  "haltospam.com","harakirimail.com","hasmail.net","hatespam.org",
  "hezll.com","hidzz.com","hmamail.com","hochsitze.com","hoer.badcreditloans.mobi",
  "honor.es","hotmails.com","housefan.com","housefan.net",
  "hsls.net","hu.st","hulapla.de","hushmail.com", // can be temp
  "hycus.com","ieatspam.eu","ieatspam.info","ieh-mail.de",
  "iheartspam.org","iliketotnetspam.com","ilikespam.com","ilovespam.com",
  "imstations.com","inboxclean.com","inboxclean.org","incognitomail.com",
  "incognitomail.net","incognitomail.org","insorg-mail.info","instant-mail.de",
  "instantemailaddress.com","internetemails.net","investoremail.com",
  "ip6.li","irishspringrealty.com","it7.ovh","itimedd.com",
  "itrashmail.com","iwi.net","izedmail.com","jetable.pp.ua",
  "jnxjn.com","jobbikszimpatizans.com","jobbikszimpatizans.hu",
  "jnxjn.com","jobbikszimpatizans.com","jobbikszimpatizans.hu",
  "jnxjn.com","jodalf.com","jsrsolutions.com","junkmail.com",
  "junkmail.ga","junkmail.gq","keepmymail.com","kimsdisk.com",
  "klassmaster.com","klassmaster.net","klassmaster.ru",
  "kooksbuurt.be","kurzepost.de","lackmail.net","lackmail.ru",
  "lags.us","letthemeatspam.com","lhsdv.com","libox.fr",
  "lishout.com","litedrop.com","litedrop.eu","livecamnetwork.com",
  "lol.ovpn.to","lopl.co.cc","lortemail.dk","lovemeleaveme.com",
  "lr78.com","lroid.com","lukemail.com","lyricspad.net",
  "m21.cc","maboard.com","mail-filter.com","mail-temporaire.fr",
  "mail.by","mail1a.de","mail21.cc","mail2rss.org","mail333.com",
  "mailbidon.com","mailbiz.biz","mailblocks.com","mailchop.com",
  "maildu.de","maileater.com","mailexpire.com","mailguard.me",
  "mailimate.com","mailinblack.com","maillinator.com","mailmetrash.com",
  "mailmoat.com","mailnew.com","mailpick.biz","mailproxsy.com",
  "mailquack.com","mailrock.biz","mailsac.com","mailscrap.com",
  "mailseal.de","mailshell.com","mailsiphon.com","mailslapping.com",
  "mailslite.com","mailsoul.com","mailsucker.net","mailtemp.info",
  "mailtemporaire.com","mailtemporaire.fr","mailtor.net","mailtothis.com",
  "mailzilla.com","mailzilla.org","mbx.cc","mega.zik.dj",
  "meltmail.com","messagebeamer.de","mierdamail.com","migmail.pl",
  "migumail.com","mintemail.com","misterpinball.de","mjukglass.nu",
  "moncourrier.fr.nf","monemail.fr.nf","monmail.fr.nf","moot.es",
  "mosaicfx.com","mycleaninbox.net","myfakemail.ga","myfakemail.gq",
  "myfreemail.us","mypartyclips.com","myspamless.com","mytempemail.com",
  "mytrashmail.com","mytrashmail.net","mytrashmail.org","mytrashmail.at",
  "neverbox.com","nospamfor.us","nospam4.us","nospamthanks.info",
  "notmailinator.com","nowmymail.com","ntlhelp.net","nwldx.com",
  "nwytg.com","odaymail.com","oepia.com","omail.pro",
  "online.ms","onetimemail.net","onewaymail.com","ordinaryamerican.net",
  "ourklips.com","out99.com","owlpic.com","pansies.us",
  "parlimentpetitioner.ga","pepbot.com","pfui.ru","php.net",
  "pickupmail.info","pickupmail.net","pimpmyip.com","pingir.com",
  "pjjkp.com","plexolan.de","pm.me","pookmail.com",
  "pop3.xyz","popesodomy.com","porr-danica.es","postacı.net",
  "privacy.net","privy-mail.com","privy-mail.de","proxymail.eu",
  "prtnx.com","punkass.com","putthisinyourspamdatabase.com",
  "pwrby.com","qq.com","qwickmail.com","r4nd0m.de",
  "raakim.com","rbox.me","rbox.co","rcpt.at",
  "recode.me","recursor.net","recyclemail.dk","reggae.fm",
  "r-o-o-t.com","rklips.com","rklips.com","rmail.cf",
  "rmqkr.net","rn.com","ronnierage.net","rppkn.com",
  "rtrtr.com","ruu.kr","safe-mail.net","safetypost.de",
  "sandelf.de","saynotospams.com","schachrol.com","secure-mail.biz",
  "secure-mail.cc","selfdestructingmail.com","SendSpamHere.com",
  "sesmail.com","sharklasers.com","shedplan.com","shieldemail.com",
  "shiftmail.com","shitmail.de","shitmail.me","shitmail.org",
  "shortmail.net","sigaret.net","signal-mail.com","simpleitsecurity.info",
  "sinemail.com","sippybaby.com","skeefmail.com","slippery.email",
  "slopsbox.com","slushmail.com","smapfree.com","smellfear.com",
  "smotmail.com","snakemail.com","sneakemail.com","sneakmail.de",
  "snkmail.com","sofimail.com","soisz.com","soodo.com",
  "sofort-mail.de","spam.la","spam.su","spam.openmail.cc",
  "spam4.me","spamavert.com","spamblock.info","spambob.net",
  "spambob.org","spambog.com","spambog.de","spambog.ru",
  "spambox.info","spambox.irishspringrealty.com","spambox.us",
  "spamcannon.com","spamcannon.net","spamcero.com","spamcon.org",
  "spamcorner.com","spamday.com","spamex.com","spamfighter.cf",
  "spamfighter.ga","spamfighter.gq","spamfighter.ml","spamfighter.tk",
  "spamfree.eu","spamgoes.in","spamgob.com","spamgourmet.com",
  "spamgourmet.net","spamgourmet.org","spamherelots.com",
  "spamhereplease.com","spaminmotion.com","spamkill.info","spaml.com",
  "spaml.de","spammotel.com","spammote.com","spamoff.de",
  "spamok.com","spamspot.com","spamstack.net","spamthis.co.uk",
  "spamthisplease.com","spamtrail.com","spamurl.com","spock.com",
  "ssoia.com","startfu.com","stinkefinger.net","stop-my-spam.com",
  "suremail.info","sweetxxx.de","ta-bu.net","tafmail.com",
  "tagyourself.com","temp-mail.com","temp-mail.de","temp-mail.io",
  "temp-mail.org","temp-mail.ru","temp-mail1.com","tempalias.com",
  "tempail.com","tempe-mail.com","tempemail.biz","tempemail.co.za",
  "tempemail.com","tempemail.net","tempemail.org","tempinbox.co.uk",
  "tempinbox.com","tempmail.it","tempmail.net","tempmail.org",
  "tempmail.us","tempmail.de","tempmail2.com","tempr.email",
  "tempsky.com","temporaryemail.net","temporaryemail.us","temporaryinbox.com",
  "temporamail.com","temporarymail.org","thankyou2010.com",
  "thc.st","thelimestones.com","thisisnotmyrealemail.com",
  "throwam.co","throwam.com","throwam.email","throwam.info",
  "throwam.net","throwam.org","throwam.us","throwaway.email",
  "throwamail.com","throwamails.com","tinyurl24.com","tloie.com",
  "tmails.net","tmail.com","tmail.io","tmail.ws","tmo.kr",
  "tmpjr.me","tmpmail.net","tmpmail.org","tradermail.info",
  "trash-amil.com","trash-mail.at","trash-mail.com","trash-mail.de",
  "trash-mail.ga","trash-mail.gq","trash-mail.io","trash-mail.me",
  "trash-mail.ml","trash-mail.net","trash-mail.org","trash-me.com",
  "trashemail.de","trashemails.de","trashimail.com","trashmail.app",
  "trashmail.at","trashmail.com","trashmail.de","trashmail.eu",
  "trashmail.fr","trashmail.io","trashmail.me","trashmail.net",
  "trashmail.org","trashmail.se","trashmail.tech","trashmail.ws",
  "trashmail.xyz","trashmailer.com","trashmailgenerator.de","trashmaill.com",
  "trashme.com","trashspam.com","trbvm.com","trillianpro.com",
  "tryalert.com","turual.com","twinmail.de","twoweirdtricks.com",
  "tyldd.com","uber.com.de","ubm.md","uggsrock.com","uhhu.ru",
  "umail.net","uroid.com","valemail.net","venompen.com",
  "viditag.com","viewcastmedia.com","viewcastmedia.net","viewcastmedia.org",
  "vkcode.ru","vmailing.info","vmani.com","vomoto.com",
  "vortex.biz.tm","vpsorg.pro","vubby.com","waniko.com",
  "wasteland.raptors.dk","watchfull.net","watchironman3onlinefreefull.com",
  "webemail.me","webm4il.info","weg-werfen.de","wegwerf-email.de",
  "wegwerf-email.net","wegwerf-email.org","wegwerf-emails.de",
  "wegwerfadresse.de","wegwerfmail.de","wegwerfmail.info","wegwerfmail.net",
  "wegwerfmail.org","wh4f.org","whatifnot.com","whopy.com",
  "wilemail.com","willhackforfood.biz","willselfdestruct.com",
  "wmail.cf","wox.cc","wudet.men","wuzup.net","wuzupmail.net",
  "wzukltd.com","xagloo.co","xagloo.com","xemaps.com",
  "xents.com","xmail.com","xmailer.be","xmaily.com","xoxy.net",
  "xpee.tk","xvx.us","xww.ro","xyz.am","yahoo.com.au.com",
  "yapped.net","yepmail.net","yodx.ro","yogamaven.com",
  "yomail.info","yopmail.com","yopmail.fr","yopmail.gq","yopmail.net",
  "yopmail.org","yopmail.pp.ua","your-mail.com","zehnminuten.de",
  "zehnminutenmail.de","zippymail.info","zoemail.com","zoemail.net",
  "zoemail.org","zomg.info","zxcv.com","zyclone.com",
]);

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  normalizedEmail?: string;
}

/**
 * Returns the canonical Gmail address:
 *   - Lowercased
 *   - Dots removed from local part
 *   - Everything after "+" in local part stripped
 */
export function normalizeGmailAddress(email: string): string {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split("@");
  if (!local || !domain) return lower;

  const localWithoutAlias = local.split("+")[0];
  const localNormalized = localWithoutAlias.replace(/\./g, "");

  return `${localNormalized}@${domain}`;
}

/**
 * Validates an email address for registration.
 * Returns { valid: true, normalizedEmail } on success,
 * or { valid: false, error } on failure.
 */
export function validateRegistrationEmail(email: string): EmailValidationResult {
  const lower = email.toLowerCase().trim();

  if (!lower || !lower.includes("@")) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  const [local, domain] = lower.split("@");
  if (!local || !domain) {
    return { valid: false, error: "Please enter a valid email address." };
  }

  // Block disposable email providers
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: "Temporary or disposable email addresses are not allowed. Please use your real Gmail account." };
  }

  // Only allow Gmail
  if (domain !== "gmail.com") {
    return { valid: false, error: "Only Gmail accounts (@gmail.com) are allowed to sign up." };
  }

  // Block Gmail "+" aliases (e.g. user+temp@gmail.com)
  if (local.includes("+")) {
    return { valid: false, error: "Gmail alias addresses (with \"+\") are not allowed. Please use your main Gmail address." };
  }

  // Block obviously suspicious patterns: all numbers, very short local
  if (local.length < 3) {
    return { valid: false, error: "Please use a valid Gmail address." };
  }

  // Block known temp-sounding Gmail patterns
  const suspiciousPatterns = [
    /^(temp|fake|noreply|no-reply|throwaway|trash|spam|disposable|mailinator|yopmail|guerrilla|burner|delete|junk)[\d._-]*/i,
  ];
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(local)) {
      return { valid: false, error: "This email address does not appear to be a valid personal Gmail account." };
    }
  }

  const normalizedEmail = normalizeGmailAddress(email);
  return { valid: true, normalizedEmail };
}
