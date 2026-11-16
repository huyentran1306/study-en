// Nội dung luyện thêm cho Chit Chat Island:
// Ao Phản Xạ (hỏi nhanh – đáp nhanh, thay từ liên tục, đừng đứng hình), nhiệm vụ chat có checklist,
// tình huống bất ngờ, câu khung bổ sung, chuyện riêng của NPC, đồ xây đảo, bộ cặp âm phát âm.
import type { Level, NpcId } from "./curriculum";

// ───────────── Hỏi nhanh – đáp nhanh ─────────────

export interface ReflexQ {
  /** NPC nói (người học phải đáp lại). */
  q: string;
  vi: string;
  /** Câu trả lời mẫu (câu đầu là câu hay nhất). */
  a: string[];
  /** Từ khoá: câu trả lời chứa một trong các cụm này thì coi là đúng ý (dùng khi AI không chấm được). */
  kw: string[];
}

export const REFLEX: Record<number, ReflexQ[]> = {
  1: [
    { q: "Hi! What's your name?", vi: "Chào! Bạn tên gì?", a: ["I'm Lan. Nice to meet you."], kw: ["i'm", "i am", "my name"] },
    { q: "Where are you from?", vi: "Bạn đến từ đâu?", a: ["I'm from Vietnam."], kw: ["from"] },
    { q: "So, what do you do?", vi: "Vậy bạn làm nghề gì?", a: ["I work as a designer."], kw: ["work", "i'm a", "i am a", "i'm an", "student", "job"] },
    { q: "Where's your hometown?", vi: "Quê bạn ở đâu?", a: ["My hometown is Da Nang."], kw: ["hometown", "from", "is in"] },
    { q: "What's your hobby?", vi: "Sở thích của bạn là gì?", a: ["My hobby is cooking."], kw: ["hobby", "i like", "i love", "i enjoy"] },
    { q: "Nice to meet you!", vi: "Rất vui được gặp bạn!", a: ["Nice to meet you too!"], kw: ["nice to meet you", "you too"] },
    { q: "How are you today?", vi: "Hôm nay bạn thế nào?", a: ["I'm good, thanks. And you?"], kw: ["good", "fine", "great", "ok", "okay", "not bad"] },
    { q: "Do you live near here?", vi: "Bạn sống gần đây không?", a: ["Yes, I live nearby.", "No, I live in Hanoi."], kw: ["yes", "no", "live"] },
    { q: "I love music. What about you?", vi: "Mình mê âm nhạc. Còn bạn?", a: ["I love music too!", "I'm more into sports."], kw: ["i love", "i like", "me too", "too", "into"] },
    { q: "Is this your first time on the island?", vi: "Đây là lần đầu bạn đến đảo à?", a: ["Yes, it's my first time."], kw: ["yes", "no", "first time"] },
  ],
  2: [
    { q: "Hi! What can I get for you?", vi: "Chào bạn! Bạn dùng gì?", a: ["Can I get a latte, please?"], kw: ["can i get", "can i have", "i'd like", "i would like", "could i", "i'll have"] },
    { q: "What size would you like?", vi: "Bạn muốn cỡ nào?", a: ["Large, please."], kw: ["small", "medium", "large", "regular"] },
    { q: "For here or to go?", vi: "Uống ở đây hay mang đi?", a: ["To go, please."], kw: ["to go", "for here", "take away", "takeaway"] },
    { q: "Hot or iced?", vi: "Nóng hay đá?", a: ["Iced, please."], kw: ["hot", "iced", "ice", "cold"] },
    { q: "Anything else?", vi: "Bạn dùng thêm gì không?", a: ["No, that's all. Thanks."], kw: ["that's all", "that is all", "no thanks", "no thank", "yes", "and a"] },
    { q: "That's four dollars, please.", vi: "Của bạn 4 đô.", a: ["Here you go."], kw: ["here you go", "here you are", "card", "cash"] },
    { q: "Would you like some sugar?", vi: "Bạn có muốn thêm đường không?", a: ["No, thanks.", "Yes, please."], kw: ["yes", "no", "please", "thanks"] },
    { q: "Can I have your name for the order?", vi: "Cho mình xin tên để gọi món nhé?", a: ["Sure, it's Lan."], kw: ["it's", "it is", "i'm", "my name"] },
    { q: "Sorry, we're out of milk tea today.", vi: "Xin lỗi, hôm nay hết trà sữa rồi.", a: ["Oh, OK. Can I get a green tea instead?"], kw: ["instead", "then", "ok", "okay", "can i get", "no problem"] },
    { q: "Here's your coffee. Enjoy!", vi: "Cà phê của bạn đây. Chúc ngon miệng!", a: ["Thank you so much!"], kw: ["thank", "thanks"] },
  ],
  3: [
    { q: "Hello! What are you looking for today?", vi: "Chào! Hôm nay bạn tìm gì?", a: ["I'm looking for some apples."], kw: ["looking for", "i want", "i need", "some", "i'd like"] },
    { q: "These carrots are really fresh today!", vi: "Cà rốt hôm nay tươi lắm!", a: ["Great! How much are they?"], kw: ["how much", "great", "nice", "fresh"] },
    { q: "They're two dollars each.", vi: "2 đô một củ.", a: ["OK, I'll take three."], kw: ["i'll take", "i will take", "ok", "okay", "expensive", "discount"] },
    { q: "How many would you like?", vi: "Bạn lấy bao nhiêu?", a: ["Four, please."], kw: ["one", "two", "three", "four", "five", "six", "a bag", "please"] },
    { q: "Do you need a bag?", vi: "Bạn cần túi không?", a: ["Yes, please.", "No, thanks. I have one."], kw: ["yes", "no", "please", "thanks"] },
    { q: "Anything else today?", vi: "Còn gì nữa không?", a: ["That's all, thanks."], kw: ["that's all", "that is all", "no", "yes", "and"] },
    { q: "That's ten dollars altogether.", vi: "Tổng cộng 10 đô.", a: ["Can I get a discount?", "Here you go."], kw: ["here you go", "discount", "cheaper", "here you are"] },
    { q: "Would you like to try one?", vi: "Bạn ăn thử một quả không?", a: ["Sure, thank you!"], kw: ["sure", "yes", "thank", "no"] },
    { q: "Sorry, the strawberries are sold out.", vi: "Xin lỗi, dâu hết rồi.", a: ["Oh no. Do you have any cherries?"], kw: ["do you have", "ok", "okay", "oh"] },
    { q: "Cash or card?", vi: "Tiền mặt hay thẻ?", a: ["Cash, please."], kw: ["cash", "card"] },
  ],
  4: [
    { q: "Hi! Can I help you?", vi: "Chào! Mình giúp gì được không?", a: ["Excuse me, where is the bank?"], kw: ["where", "excuse me", "how do i get", "looking for"] },
    { q: "Excuse me, where's the post office?", vi: "Xin lỗi, bưu điện ở đâu?", a: ["Go straight and turn left. It's next to the bank."], kw: ["go straight", "turn left", "turn right", "next to", "opposite", "straight"] },
    { q: "Is the park far from here?", vi: "Công viên có xa đây không?", a: ["No, it's about five minutes on foot."], kw: ["no", "yes", "minutes", "far", "near", "close"] },
    { q: "Go straight and turn left at the corner.", vi: "Đi thẳng rồi rẽ trái ở góc đường.", a: ["Turn left at the corner. Got it, thanks!"], kw: ["thank", "got it", "turn left", "ok", "okay"] },
    { q: "Where's the café?", vi: "Quán cà phê ở đâu?", a: ["It's opposite the bookstore."], kw: ["opposite", "next to", "near", "behind", "in front of", "on the"] },
    { q: "How do I get to the station?", vi: "Đến nhà ga đi thế nào?", a: ["Take the second right, then go straight."], kw: ["go straight", "turn", "take", "right", "left"] },
    { q: "It's next to the pharmacy.", vi: "Nó ở cạnh hiệu thuốc.", a: ["Next to the pharmacy? Thanks a lot!"], kw: ["thank", "next to", "ok", "okay"] },
    { q: "Are you lost?", vi: "Bạn bị lạc à?", a: ["Yes, I'm looking for the museum."], kw: ["yes", "looking for", "no", "where"] },
    { q: "Can I walk there?", vi: "Mình đi bộ tới đó được không?", a: ["Yes, it's not far."], kw: ["yes", "no", "walk", "far", "bus", "taxi"] },
    { q: "Sorry, I'm not from here.", vi: "Xin lỗi, mình không phải người ở đây.", a: ["No problem. Thanks anyway!"], kw: ["no problem", "thanks anyway", "thank", "ok", "okay", "no worries"] },
  ],
  5: [
    { q: "Can I see your passport, please?", vi: "Cho tôi xem hộ chiếu nhé?", a: ["Sure, here you go."], kw: ["here you go", "here it is", "sure", "here you are"] },
    { q: "Window or aisle seat?", vi: "Ghế cửa sổ hay lối đi?", a: ["An aisle seat, please."], kw: ["aisle", "window"] },
    { q: "How many bags are you checking in?", vi: "Bạn ký gửi mấy kiện hành lý?", a: ["Just one bag."], kw: ["one", "two", "just", "no bags", "none"] },
    { q: "Your gate is B12. Boarding starts at nine.", vi: "Cửa B12. Lên máy bay lúc 9 giờ.", a: ["Gate B12 at nine. Thank you!"], kw: ["thank", "gate", "ok", "okay"] },
    { q: "Do you have a reservation?", vi: "Bạn có đặt phòng trước không?", a: ["Yes, under the name Lan Tran."], kw: ["yes", "under", "no", "reservation"] },
    { q: "How many nights are you staying?", vi: "Bạn ở mấy đêm?", a: ["Three nights."], kw: ["night", "one", "two", "three", "four", "five", "week"] },
    { q: "What's the purpose of your visit?", vi: "Mục đích chuyến đi của bạn là gì?", a: ["I'm here on holiday."], kw: ["holiday", "vacation", "business", "visit", "travel", "work", "study"] },
    { q: "Is this your luggage?", vi: "Đây là hành lý của bạn à?", a: ["Yes, that's mine."], kw: ["yes", "no", "mine"] },
    { q: "Would you like a room with a view?", vi: "Bạn có muốn phòng có view không?", a: ["Yes, please. How much extra is it?"], kw: ["yes", "no", "please", "how much"] },
    { q: "Breakfast is from seven to ten.", vi: "Bữa sáng từ 7 đến 10 giờ.", a: ["Great, thanks. Where is it?"], kw: ["thank", "where", "great", "ok", "okay"] },
  ],
  6: [
    { q: "Good evening! Do you have a reservation?", vi: "Chào buổi tối! Bạn đã đặt bàn chưa?", a: ["Yes, a table for two under Lan."], kw: ["yes", "no", "table for", "under", "reservation"] },
    { q: "How many people?", vi: "Mấy người ạ?", a: ["A table for two, please."], kw: ["two", "three", "four", "one", "table for", "people", "just me"] },
    { q: "Are you ready to order?", vi: "Bạn gọi món chưa?", a: ["Yes, I'll have the chicken soup."], kw: ["i'll have", "i will have", "can i get", "i'd like", "not yet", "a few more minutes", "yes"] },
    { q: "Would you like a recommendation?", vi: "Bạn có muốn mình gợi ý món không?", a: ["Yes, what do you recommend?"], kw: ["yes", "recommend", "what", "sure", "no"] },
    { q: "Are you allergic to anything?", vi: "Bạn có dị ứng gì không?", a: ["Yes, I'm allergic to peanuts."], kw: ["allergic", "no", "nothing", "yes"] },
    { q: "How's your meal?", vi: "Món ăn thế nào?", a: ["It's delicious, thank you!"], kw: ["delicious", "good", "great", "tasty", "nice", "amazing"] },
    { q: "Would you like some dessert?", vi: "Bạn dùng tráng miệng không?", a: ["No, thanks. Can we have the bill, please?"], kw: ["yes", "no", "bill", "please", "thanks"] },
    { q: "Something to drink?", vi: "Bạn uống gì không?", a: ["Just water, please."], kw: ["water", "juice", "tea", "coffee", "coke", "please", "nothing"] },
    { q: "I'm sorry, the fish is finished tonight.", vi: "Xin lỗi, tối nay hết món cá rồi.", a: ["That's OK. I'll have the beef instead."], kw: ["instead", "ok", "okay", "i'll have", "that's fine"] },
    { q: "Here's your bill.", vi: "Hoá đơn của bạn đây.", a: ["Thank you. Can I pay by card?"], kw: ["thank", "card", "cash", "pay"] },
  ],
  7: [
    { q: "Hello, who's calling, please?", vi: "Alo, ai gọi đấy ạ?", a: ["Hi, this is Lan."], kw: ["this is", "it's", "it is", "speaking"] },
    { q: "Are you free on Friday?", vi: "Thứ Sáu bạn rảnh không?", a: ["Yes, I'm free in the afternoon."], kw: ["yes", "no", "free", "busy", "available"] },
    { q: "How about three pm?", vi: "3 giờ chiều được không?", a: ["That works for me."], kw: ["works for me", "sounds good", "ok", "okay", "great", "how about", "can we"] },
    { q: "Sorry, she's not available right now.", vi: "Xin lỗi, cô ấy đang bận.", a: ["Could I leave a message?"], kw: ["leave a message", "call back", "ok", "okay", "later", "message"] },
    { q: "Can we reschedule our meeting?", vi: "Mình dời lịch họp được không?", a: ["Sure. How about Monday?"], kw: ["sure", "how about", "yes", "of course", "no problem", "when"] },
    { q: "What time works for you?", vi: "Mấy giờ thì tiện cho bạn?", a: ["Ten o'clock works for me."], kw: ["o'clock", "am", "pm", "works", "morning", "afternoon", "at"] },
    { q: "Could you spell your name, please?", vi: "Bạn đánh vần tên được không?", a: ["Sure, L-A-N."], kw: ["sure", "yes", "it's", "l a n"] },
    { q: "Sorry, the line is bad. Can you hear me?", vi: "Xin lỗi, sóng yếu. Bạn nghe rõ không?", a: ["Sorry, could you say that again?"], kw: ["again", "yes", "hear", "can't", "cannot", "louder"] },
    { q: "Let's meet at the café at six.", vi: "Gặp ở quán cà phê lúc 6 giờ nhé.", a: ["Great, see you there!"], kw: ["see you", "great", "ok", "okay", "sounds"] },
    { q: "Can I take a message?", vi: "Bạn có muốn để lại lời nhắn không?", a: ["Yes, please tell him Lan called."], kw: ["yes", "please", "tell", "no thanks", "call"] },
  ],
  8: [
    { q: "What seems to be the problem?", vi: "Bạn bị làm sao?", a: ["I have a headache and a fever."], kw: ["i have", "i've got", "headache", "fever", "sore", "pain", "hurt", "sick", "cough"] },
    { q: "How long have you had it?", vi: "Bạn bị bao lâu rồi?", a: ["Since Monday."], kw: ["since", "for", "days", "week", "yesterday"] },
    { q: "Do you have a fever?", vi: "Bạn có sốt không?", a: ["Yes, a little.", "No, I don't."], kw: ["yes", "no", "little"] },
    { q: "Are you taking any medicine?", vi: "Bạn có đang uống thuốc gì không?", a: ["No, I'm not."], kw: ["no", "yes", "taking", "not"] },
    { q: "Take this twice a day after meals.", vi: "Uống thuốc này 2 lần/ngày sau bữa ăn.", a: ["Twice a day after meals. Got it."], kw: ["twice", "got it", "ok", "okay", "thank"] },
    { q: "Do you have a prescription?", vi: "Bạn có đơn thuốc không?", a: ["Yes, here it is."], kw: ["yes", "no", "here"] },
    { q: "Where does it hurt?", vi: "Bạn đau ở đâu?", a: ["My throat hurts."], kw: ["my", "hurts", "throat", "head", "stomach", "back", "here"] },
    { q: "Are you allergic to any medicine?", vi: "Bạn có dị ứng thuốc nào không?", a: ["No, I'm not."], kw: ["no", "yes", "allergic", "not"] },
    { q: "You should rest for two days.", vi: "Bạn nên nghỉ ngơi 2 ngày.", a: ["OK. Can I go to work tomorrow?"], kw: ["ok", "okay", "thank", "can i", "work"] },
    { q: "How are you feeling today?", vi: "Hôm nay bạn thấy thế nào?", a: ["Much better, thanks."], kw: ["better", "good", "not", "still", "fine", "worse", "sick"] },
  ],
  9: [
    { q: "Hey! How's it going?", vi: "Ê! Dạo này sao rồi?", a: ["Pretty good, thanks. How about you?"], kw: ["good", "great", "fine", "not bad", "busy", "pretty"] },
    { q: "What do you do in your free time?", vi: "Lúc rảnh bạn làm gì?", a: ["I'm into photography these days."], kw: ["i'm into", "i like", "i love", "i enjoy", "free time", "usually", "play", "watch", "read"] },
    { q: "Have you been busy lately?", vi: "Dạo này bạn có bận không?", a: ["Yes, really busy with work."], kw: ["yes", "no", "busy", "work", "really", "quite"] },
    { q: "What do you think of this island?", vi: "Bạn thấy hòn đảo này thế nào?", a: ["I think it's really peaceful."], kw: ["i think", "it's", "it is", "beautiful", "nice", "love", "great"] },
    { q: "Lovely weather today, isn't it?", vi: "Hôm nay trời đẹp nhỉ?", a: ["Yes, it's so sunny!"], kw: ["yes", "it is", "it's", "no", "lovely", "nice", "beautiful"] },
    { q: "I think summer is the best season.", vi: "Mình nghĩ mùa hè là mùa đẹp nhất.", a: ["I see your point, but I prefer autumn."], kw: ["i agree", "i see your point", "i prefer", "me too", "i think", "but", "agree"] },
    { q: "Do you watch any TV shows?", vi: "Bạn có xem chương trình TV nào không?", a: ["Yes, I'm watching a Korean drama."], kw: ["yes", "no", "watching", "watch", "show", "drama"] },
    { q: "By the way, do you like music?", vi: "À mà bạn có thích nhạc không?", a: ["Yes, I love jazz."], kw: ["yes", "no", "love", "like", "into"] },
    { q: "Coffee is better than tea, right?", vi: "Cà phê ngon hơn trà, đúng không?", a: ["I'm not so sure. I prefer tea."], kw: ["i agree", "not so sure", "i prefer", "i think", "right", "agree", "disagree", "yes", "no"] },
    { q: "What did you do last weekend?", vi: "Cuối tuần trước bạn làm gì?", a: ["I went hiking with friends."], kw: ["i went", "i stayed", "i watched", "i visited", "i played", "i did", "i had"] },
  ],
  10: [
    { q: "Do you want to go to the beach this weekend?", vi: "Cuối tuần này đi biển không?", a: ["I'd love to! What time?"], kw: ["i'd love to", "i would love", "sure", "sounds", "i'm afraid", "sorry", "yes"] },
    { q: "Want to grab lunch tomorrow?", vi: "Mai đi ăn trưa không?", a: ["I'm afraid I can't. Maybe another time?"], kw: ["i'm afraid", "another time", "sure", "i'd love", "sounds", "yes", "sorry"] },
    { q: "Let's watch a movie tonight!", vi: "Tối nay xem phim đi!", a: ["Sounds perfect! Which one?"], kw: ["sounds", "sure", "great", "i'd love", "i'm afraid", "which"] },
    { q: "Can you come to my party on Saturday?", vi: "Thứ Bảy bạn đến tiệc của mình được không?", a: ["I'd love to, but I have to work."], kw: ["i'd love", "but", "sure", "yes", "i'm afraid", "can't", "cannot"] },
    { q: "How about seven pm?", vi: "7 giờ tối nhé?", a: ["Seven pm works for me."], kw: ["works", "sounds", "ok", "okay", "how about", "great", "perfect"] },
    { q: "Shall we invite Miso too?", vi: "Mình rủ Miso luôn nhé?", a: ["Good idea!"], kw: ["good idea", "sure", "yes", "why not", "great", "no"] },
    { q: "Sorry, I can't make it today.", vi: "Xin lỗi, hôm nay mình không đến được.", a: ["No worries. Maybe another time!"], kw: ["no worries", "no problem", "another time", "that's ok", "that's okay", "next time"] },
    { q: "Let me know if you can come.", vi: "Báo mình nếu bạn đến được nhé.", a: ["Sure, I'll let you know tonight."], kw: ["i'll let you know", "sure", "ok", "okay", "will"] },
    { q: "Do you want to join our book club?", vi: "Bạn tham gia câu lạc bộ sách không?", a: ["Thanks, but I'm not really into books."], kw: ["thanks", "but", "sure", "i'd love", "yes", "not really", "i'm afraid"] },
    { q: "We could go hiking or swimming. What do you think?", vi: "Đi leo núi hay bơi? Bạn nghĩ sao?", a: ["I think hiking sounds more fun."], kw: ["i think", "sounds", "prefer", "rather", "hiking", "swimming", "let's"] },
  ],
  11: [
    { q: "Guess what! I saw a dolphin yesterday!", vi: "Đoán xem! Hôm qua mình thấy cá heo!", a: ["Really? What happened?"], kw: ["really", "what happened", "wow", "no way", "amazing", "where"] },
    { q: "What happened to your phone?", vi: "Điện thoại bạn bị sao vậy?", a: ["I dropped it in the water."], kw: ["i dropped", "i lost", "broke", "fell", "it"] },
    { q: "How was your trip?", vi: "Chuyến đi thế nào?", a: ["It was amazing. First, we went to the beach."], kw: ["it was", "great", "amazing", "good", "fun", "bad", "first"] },
    { q: "What did you do first?", vi: "Đầu tiên bạn làm gì?", a: ["First, I checked in at the hotel."], kw: ["first", "i"] },
    { q: "And then?", vi: "Rồi sao nữa?", a: ["Then it suddenly started to rain."], kw: ["then", "after that", "suddenly", "next"] },
    { q: "Why were you late this morning?", vi: "Sao sáng nay bạn đến muộn?", a: ["My bus broke down, so I had to walk."], kw: ["because", "my", "bus", "traffic", "so", "i"] },
    { q: "How did it end?", vi: "Cuối cùng thì sao?", a: ["In the end, everything was fine."], kw: ["in the end", "finally", "at last", "it was"] },
    { q: "Have you ever been to Japan?", vi: "Bạn đến Nhật bao giờ chưa?", a: ["Yes, I went there last year."], kw: ["yes", "no", "never", "i went", "last"] },
    { q: "What's the funniest thing that happened to you?", vi: "Chuyện buồn cười nhất từng xảy ra với bạn là gì?", a: ["Once, I got on the wrong bus!"], kw: ["once", "one day", "when", "i"] },
    { q: "I lost my keys again!", vi: "Mình lại làm mất chìa khoá rồi!", a: ["Oh no! Where did you last see them?"], kw: ["oh no", "where", "sorry", "again", "really"] },
  ],
  12: [
    { q: "How is everything?", vi: "Mọi thứ ổn chứ ạ?", a: ["I'm afraid there's a problem. My soup is cold."], kw: ["i'm afraid", "problem", "cold", "good", "fine", "great", "there's"] },
    { q: "What seems to be the problem?", vi: "Có vấn đề gì vậy ạ?", a: ["I ordered a pizza, but I got pasta."], kw: ["i ordered", "but", "wrong", "problem", "broken", "doesn't work", "not working"] },
    { q: "I'm so sorry about that.", vi: "Thành thật xin lỗi bạn.", a: ["No worries. Could you change it, please?"], kw: ["no worries", "could you", "it's ok", "it's okay", "that's ok", "please", "change"] },
    { q: "Would you like a refund or a new one?", vi: "Bạn muốn hoàn tiền hay đổi cái mới?", a: ["A new one, please."], kw: ["refund", "new one", "please"] },
    { q: "So the air conditioner in your room doesn't work?", vi: "Máy lạnh phòng bạn không chạy à?", a: ["Yes, could someone fix it, please?"], kw: ["yes", "fix", "could", "someone", "no"] },
    { q: "This dessert is on the house.", vi: "Món tráng miệng này quán mời.", a: ["Oh, thank you so much!"], kw: ["thank", "thanks", "so kind", "great"] },
    { q: "Can I see your receipt?", vi: "Cho mình xem hoá đơn nhé?", a: ["Sure, here it is."], kw: ["sure", "here", "yes"] },
    { q: "We can give you another room instead.", vi: "Chúng tôi có thể đổi phòng khác cho bạn.", a: ["That would be great, thanks."], kw: ["great", "thanks", "thank", "ok", "okay", "that would"] },
    { q: "Sorry, we can't give a refund.", vi: "Xin lỗi, chúng tôi không hoàn tiền được.", a: ["Could I speak to the manager, please?"], kw: ["manager", "could i", "why", "exchange", "but", "i understand"] },
    { q: "Is there anything else I can help with?", vi: "Còn gì mình giúp được nữa không?", a: ["No, that's all. Thanks for your help."], kw: ["no", "that's all", "thanks", "thank", "yes"] },
  ],
  13: [
    { q: "Tell me a little about yourself.", vi: "Giới thiệu đôi chút về bạn nhé.", a: ["I'm Lan. I've worked as a designer for three years."], kw: ["i'm", "i am", "i've", "i have", "i work", "worked", "my name"] },
    { q: "What's your biggest strength?", vi: "Điểm mạnh lớn nhất của bạn là gì?", a: ["I'm good at solving problems."], kw: ["i'm good at", "good at", "strength", "i can", "i am"] },
    { q: "Do you have any experience in this field?", vi: "Bạn có kinh nghiệm trong lĩnh vực này không?", a: ["Yes, I have two years of experience."], kw: ["yes", "no", "experience", "years", "worked"] },
    { q: "How do you deal with stress?", vi: "Bạn xử lý áp lực thế nào?", a: ["I make a list and take short breaks."], kw: ["i", "deal", "take", "make", "try"] },
    { q: "Are you a team player?", vi: "Bạn có làm việc nhóm tốt không?", a: ["Yes, I enjoy working with others."], kw: ["yes", "team", "enjoy", "working with", "i like"] },
    { q: "Why do you want this job?", vi: "Vì sao bạn muốn công việc này?", a: ["Because I love working with people."], kw: ["because", "i love", "i want", "i like", "interested"] },
    { q: "What's a typical day like for you?", vi: "Một ngày bình thường của bạn thế nào?", a: ["I usually start with emails, then meetings."], kw: ["usually", "i start", "first", "then", "every day", "typical"] },
    { q: "What's your weakness?", vi: "Điểm yếu của bạn là gì?", a: ["Sometimes I worry too much, but I'm working on it."], kw: ["sometimes", "but", "working on", "weakness", "i"] },
    { q: "When can you start?", vi: "Khi nào bạn có thể bắt đầu?", a: ["I can start next Monday."], kw: ["i can start", "next", "monday", "week", "month", "right away", "as soon as"] },
    { q: "Do you have any questions for us?", vi: "Bạn có câu hỏi nào cho chúng tôi không?", a: ["Yes, what does a typical day look like?"], kw: ["yes", "what", "how", "no", "could you"] },
  ],
};

// ───────────── Thay từ liên tục (substitution drill) ─────────────

export interface Swap {
  /** Khung câu, "___" là chỗ thay. */
  frame: string;
  frameVi: string;
  tip?: string;
  cues: { vi: string; fill: string }[];
}

export const SWAPS: Record<number, Swap[]> = {
  1: [{ frame: "I work as ___.", frameVi: "Mình làm nghề ___.", tip: "Nhớ a/an: an + nguyên âm (an engineer).", cues: [
    { vi: "giáo viên", fill: "a teacher" }, { vi: "y tá", fill: "a nurse" }, { vi: "kỹ sư", fill: "an engineer" },
    { vi: "đầu bếp", fill: "a chef" }, { vi: "nhà thiết kế", fill: "a designer" }, { vi: "kế toán", fill: "an accountant" },
  ] }],
  2: [{ frame: "Can I get ___, please?", frameVi: "Cho mình ___ nhé?", cues: [
    { vi: "một trà xanh lớn", fill: "a large green tea" }, { vi: "một latte đá", fill: "an iced latte" }, { vi: "hai bánh sừng bò", fill: "two croissants" },
    { vi: "một nước cam nhỏ", fill: "a small orange juice" }, { vi: "một trà sữa mang đi", fill: "a milk tea to go" }, { vi: "một ly nước", fill: "a glass of water" },
  ] }],
  3: [{ frame: "How much ___?", frameVi: "___ bao nhiêu tiền?", tip: "Số nhiều dùng are, số ít dùng is.", cues: [
    { vi: "mấy quả táo này", fill: "are these apples" }, { vi: "quả dưa này", fill: "is this melon" }, { vi: "mấy củ cà rốt", fill: "are the carrots" },
    { vi: "một túi khoai tây", fill: "is a bag of potatoes" }, { vi: "trứng", fill: "are the eggs" }, { vi: "bó hoa này", fill: "is this bunch of flowers" },
  ] }],
  4: [{ frame: "Excuse me, where is ___?", frameVi: "Xin lỗi, ___ ở đâu ạ?", cues: [
    { vi: "ngân hàng", fill: "the bank" }, { vi: "nhà ga", fill: "the station" }, { vi: "bưu điện", fill: "the post office" },
    { vi: "nhà vệ sinh", fill: "the restroom" }, { vi: "hiệu thuốc", fill: "the pharmacy" }, { vi: "bến xe buýt", fill: "the bus stop" },
  ] }],
  5: [{ frame: "I'd like ___, please.", frameVi: "Cho mình ___ nhé.", cues: [
    { vi: "ghế cạnh lối đi", fill: "an aisle seat" }, { vi: "ghế cạnh cửa sổ", fill: "a window seat" }, { vi: "phòng đôi", fill: "a double room" },
    { vi: "phòng có ban công", fill: "a room with a balcony" }, { vi: "taxi lúc 8 giờ sáng", fill: "a taxi at 8 am" }, { vi: "thêm một chiếc gối", fill: "an extra pillow" },
  ] }],
  6: [{ frame: "Could we have ___, please?", frameVi: "Cho chúng mình ___ được không?", cues: [
    { vi: "bàn cho hai người", fill: "a table for two" }, { vi: "thực đơn", fill: "the menu" }, { vi: "hoá đơn", fill: "the bill" },
    { vi: "thêm chút nước", fill: "some more water" }, { vi: "bàn gần cửa sổ", fill: "a table by the window" }, { vi: "hai đôi đũa", fill: "two pairs of chopsticks" },
  ] }],
  7: [{ frame: "Are you free on ___?", frameVi: "Bạn rảnh vào ___ không?", cues: [
    { vi: "thứ Hai", fill: "Monday" }, { vi: "tối thứ Sáu", fill: "Friday evening" }, { vi: "sáng thứ Bảy", fill: "Saturday morning" },
    { vi: "chiều Chủ nhật", fill: "Sunday afternoon" }, { vi: "thứ Tư tuần sau", fill: "next Wednesday" }, { vi: "ngày 15", fill: "the 15th" },
  ] }],
  8: [{ frame: "I have ___.", frameVi: "Mình bị ___.", cues: [
    { vi: "đau đầu", fill: "a headache" }, { vi: "đau họng", fill: "a sore throat" }, { vi: "sốt", fill: "a fever" },
    { vi: "ho", fill: "a cough" }, { vi: "sổ mũi", fill: "a runny nose" }, { vi: "đau bụng", fill: "a stomachache" },
  ] }],
  9: [
    { frame: "These days, I'm really into ___.", frameVi: "Dạo này mình rất mê ___.", cues: [
      { vi: "chụp ảnh", fill: "photography" }, { vi: "nấu ăn", fill: "cooking" }, { vi: "chạy bộ", fill: "running" },
      { vi: "chơi game", fill: "video games" }, { vi: "làm vườn", fill: "gardening" }, { vi: "học tiếng Anh", fill: "learning English" },
    ] },
    { frame: "I see your point, but I prefer ___.", frameVi: "Mình hiểu ý bạn, nhưng mình thích ___ hơn.", tip: "Cách phản đối nhẹ nhàng: công nhận trước, rồi nói ý mình.", cues: [
      { vi: "trà", fill: "tea" }, { vi: "mùa thu", fill: "autumn" }, { vi: "ở nhà", fill: "staying home" },
      { vi: "biển", fill: "the beach" }, { vi: "sách giấy", fill: "paper books" }, { vi: "đi xe buýt", fill: "taking the bus" },
    ] },
  ],
  10: [
    { frame: "I'd love to, but I ___.", frameVi: "Mình rất muốn, nhưng mình ___.", cues: [
      { vi: "phải làm việc", fill: "have to work" }, { vi: "có hẹn rồi", fill: "already have plans" }, { vi: "không khoẻ lắm", fill: "am not feeling well" },
      { vi: "phải học bài", fill: "have to study" }, { vi: "đang đi xa", fill: "am out of town" }, { vi: "phải đón em gái", fill: "have to pick up my sister" },
    ] },
    { frame: "Why don't we ___?", frameVi: "Sao mình không ___ nhỉ?", tip: "Câu rủ rê tự nhiên, nghe thân thiện hơn “Let's”.", cues: [
      { vi: "đi biển", fill: "go to the beach" }, { vi: "xem phim", fill: "watch a movie" }, { vi: "ăn trưa cùng nhau", fill: "have lunch together" },
      { vi: "đi dạo", fill: "go for a walk" }, { vi: "chơi cầu lông", fill: "play badminton" }, { vi: "gọi pizza", fill: "order pizza" },
    ] },
  ],
  11: [
    { frame: "Suddenly, ___.", frameVi: "Đột nhiên, ___.", tip: "Kể chuyện dùng quá khứ: started, went, rang...", cues: [
      { vi: "trời bắt đầu mưa", fill: "it started to rain" }, { vi: "mất điện", fill: "the lights went out" }, { vi: "điện thoại mình reo", fill: "my phone rang" },
      { vi: "con mèo nhảy lên", fill: "the cat jumped up" }, { vi: "xe buýt dừng lại", fill: "the bus stopped" }, { vi: "mình làm rơi ly", fill: "I dropped my glass" },
    ] },
    { frame: "To be honest, I think ___.", frameVi: "Thật lòng, mình nghĩ ___.", tip: "Nêu ý kiến thẳng thắn mà vẫn lịch sự.", cues: [
      { vi: "bộ phim hơi dài", fill: "the movie was a bit too long" }, { vi: "chuyến đi rất đáng", fill: "the trip was worth it" }, { vi: "món này hơi cay", fill: "this dish is a bit spicy" },
      { vi: "giá hơi cao", fill: "the price is a bit high" }, { vi: "đó là ý hay", fill: "that's a great idea" }, { vi: "mình nên đi sớm", fill: "we should leave early" },
    ] },
  ],
  12: [{ frame: "I'm afraid ___.", frameVi: "Mình e là ___.", cues: [
    { vi: "súp bị nguội", fill: "the soup is cold" }, { vi: "phòng quá ồn", fill: "the room is too noisy" }, { vi: "máy lạnh không chạy", fill: "the air conditioner doesn't work" },
    { vi: "mình nhận nhầm món", fill: "I got the wrong dish" }, { vi: "hoá đơn bị sai", fill: "the bill is wrong" }, { vi: "wifi không vào được", fill: "the wifi isn't working" },
  ] }],
  13: [{ frame: "I'm good at ___.", frameVi: "Mình giỏi ___.", tip: "Sau “good at” dùng V-ing.", cues: [
    { vi: "giải quyết vấn đề", fill: "solving problems" }, { vi: "làm việc nhóm", fill: "working in a team" }, { vi: "quản lý thời gian", fill: "managing my time" },
    { vi: "nói chuyện với khách hàng", fill: "talking to customers" }, { vi: "học cái mới", fill: "learning new things" }, { vi: "sắp xếp công việc", fill: "organizing tasks" },
  ] }],
};

// ───────────── Đừng đứng hình (câu câu giờ) ─────────────

export const FILLERS: { en: string; vi: string }[] = [
  { en: "Hmm, let me think...", vi: "Để mình nghĩ chút..." },
  { en: "Well, ...", vi: "À thì..." },
  { en: "That's a good question.", vi: "Câu hỏi hay đấy." },
  { en: "How can I put it...", vi: "Nói sao nhỉ..." },
  { en: "I'm not sure, but I think...", vi: "Mình không chắc, nhưng mình nghĩ..." },
  { en: "To be honest, ...", vi: "Thật lòng mà nói..." },
  { en: "Actually, ...", vi: "Thật ra là..." },
  { en: "Let me see...", vi: "Để xem nào..." },
];

/** Cụm để nhận ra người học đã dùng câu câu giờ (so trên chữ thường). */
export const FILLER_KEYS = ["let me think", "well", "good question", "how can i put", "not sure", "to be honest", "honestly", "actually", "let me see", "you know", "i mean", "hmm", "interesting question"];

export const FILLER_QS: Record<Level, { q: string; vi: string }[]> = {
  A1: [
    { q: "What's your favorite food, and why?", vi: "Món ăn bạn thích nhất là gì, vì sao?" },
    { q: "What do you usually do on Sundays?", vi: "Chủ nhật bạn thường làm gì?" },
    { q: "Tell me about your family.", vi: "Kể về gia đình bạn đi." },
    { q: "What's your hometown like?", vi: "Quê bạn như thế nào?" },
    { q: "What did you have for breakfast today?", vi: "Sáng nay bạn ăn gì?" },
    { q: "What's your dream job?", vi: "Công việc mơ ước của bạn là gì?" },
    { q: "What's the best place in your city?", vi: "Nơi đẹp nhất ở thành phố bạn là đâu?" },
    { q: "Why are you learning English?", vi: "Vì sao bạn học tiếng Anh?" },
  ],
  A2: [
    { q: "What's the best trip you've ever taken?", vi: "Chuyến đi tuyệt nhất bạn từng đi là gì?" },
    { q: "How do you usually spend your holidays?", vi: "Bạn thường nghỉ lễ thế nào?" },
    { q: "What would you do with a free day tomorrow?", vi: "Nếu mai được nghỉ một ngày, bạn sẽ làm gì?" },
    { q: "Can you recommend a good restaurant?", vi: "Bạn gợi ý một nhà hàng ngon được không?" },
    { q: "How do you stay healthy?", vi: "Bạn giữ sức khoẻ thế nào?" },
    { q: "What's the hardest thing about your job or studies?", vi: "Điều khó nhất trong công việc/học tập của bạn là gì?" },
    { q: "What do you do when you feel stressed?", vi: "Khi căng thẳng bạn làm gì?" },
    { q: "Where would you like to travel next?", vi: "Bạn muốn đi du lịch đâu tiếp theo?" },
  ],
  B1: [
    { q: "Do you think social media is good or bad for us?", vi: "Bạn nghĩ mạng xã hội tốt hay xấu?" },
    { q: "What's one thing you'd change about your city?", vi: "Bạn muốn thay đổi điều gì ở thành phố mình?" },
    { q: "Is it better to live in a city or in the countryside?", vi: "Sống ở thành phố hay nông thôn tốt hơn?" },
    { q: "What makes a good friend?", vi: "Thế nào là một người bạn tốt?" },
    { q: "Should children have phones at school?", vi: "Trẻ em có nên mang điện thoại đến trường?" },
    { q: "What's the most useful skill to learn today?", vi: "Kỹ năng hữu ích nhất nên học bây giờ là gì?" },
    { q: "Would you rather work from home or at the office? Why?", vi: "Bạn thích làm ở nhà hay văn phòng? Vì sao?" },
    { q: "What's a decision you're proud of?", vi: "Quyết định nào bạn tự hào?" },
  ],
};

// ───────────── Chat có nhiệm vụ + tình huống bất ngờ ─────────────

export interface ChatTask {
  vi: string;
  kw: string[];
}

export const CHAT_TASKS: Record<number, { tasks: ChatTask[]; twist: { vi: string; instruction: string } }> = {
  1: {
    tasks: [
      { vi: "Nói tên của bạn", kw: ["i'm", "i am", "my name"] },
      { vi: "Nói bạn đến từ đâu", kw: ["from", "hometown"] },
      { vi: "Hỏi lại Pip một câu", kw: ["what about you", "and you", "how about you", "what do you", "where are you", "do you"] },
    ],
    twist: { vi: "Pip nghe nhầm tên bạn — hãy sửa lại thật lịch sự", instruction: "In your next reply, mishear the learner's name and call them by a wrong, similar-sounding name, so they must politely correct you." },
  },
  2: {
    tasks: [
      { vi: "Gọi một đồ uống", kw: ["can i get", "can i have", "i'd like", "i would like", "could i get", "could i have", "i'll have"] },
      { vi: "Hỏi giá", kw: ["how much"] },
      { vi: "Nói mang đi hay uống tại quán", kw: ["to go", "for here", "take away", "takeaway"] },
    ],
    twist: { vi: "Quán vừa hết đúng món bạn gọi", instruction: "The first drink the learner orders is sold out today. Tell them and suggest something else." },
  },
  3: {
    tasks: [
      { vi: "Hỏi giá", kw: ["how much"] },
      { vi: "Nói số lượng muốn mua", kw: ["one", "two", "three", "four", "five", "six", "a bag of", "kilo", "a few"] },
      { vi: "Xin giảm giá", kw: ["discount", "cheaper", "lower the price", "best price", "special price"] },
    ],
    twist: { vi: "Mallow tính nhầm tiền — chỉ ra thật khéo", instruction: "When you tell the total price, make a clear calculation mistake (too expensive) so the learner must politely point it out." },
  },
  4: {
    tasks: [
      { vi: "Hỏi đường tới một nơi", kw: ["where is", "where's", "how do i get", "how can i get", "looking for"] },
      { vi: "Hỏi có xa không", kw: ["far", "how long", "minutes"] },
      { vi: "Nhắc lại chỉ dẫn để kiểm tra", kw: ["so i", "turn left", "turn right", "go straight", "so, i"] },
    ],
    twist: { vi: "Đường quen đang sửa, phải hỏi lối khác", instruction: "Tell the learner the usual road is closed for repairs, so they need to ask for another way." },
  },
  5: {
    tasks: [
      { vi: "Đưa hộ chiếu hoặc nói tên đặt phòng", kw: ["passport", "here you go", "here it is", "reservation", "under"] },
      { vi: "Chọn chỗ ngồi hoặc loại phòng", kw: ["aisle", "window", "single", "double", "room"] },
      { vi: "Hỏi giờ hoặc cửa lên máy bay", kw: ["gate", "what time", "boarding", "when"] },
    ],
    twist: { vi: "Chuyến bay bị hoãn 2 tiếng", instruction: "Tell the learner their flight is delayed by two hours, and let them ask what to do." },
  },
  6: {
    tasks: [
      { vi: "Đặt bàn hoặc nói số người", kw: ["table for", "book a table", "reservation", "people"] },
      { vi: "Gọi món", kw: ["i'll have", "i would like", "i'd like", "can i get", "can i have"] },
      { vi: "Xin hoá đơn", kw: ["bill", "check", "pay"] },
    ],
    twist: { vi: "Món được gợi ý có đậu phộng và hải sản", instruction: "Recommend a dish that contains peanuts and seafood, so the learner should mention an allergy or ask about the ingredients." },
  },
  7: {
    tasks: [
      { vi: "Giới thiệu mình là ai khi gọi", kw: ["this is", "it's", "speaking"] },
      { vi: "Đề xuất một thời gian", kw: ["how about", "are you free", "what about", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", " pm", " am", "o'clock"] },
      { vi: "Xác nhận lịch hẹn", kw: ["works for me", "see you", "sounds good", "confirm", "perfect"] },
    ],
    twist: { vi: "Kero bận đúng giờ bạn đề xuất", instruction: "Say you're busy at the first time the learner suggests, so they must suggest another time." },
  },
  8: {
    tasks: [
      { vi: "Nói triệu chứng", kw: ["headache", "sore throat", "fever", "cough", "pain", "hurt", "stomach", "sick", "runny nose"] },
      { vi: "Nói bị từ khi nào", kw: ["since", "for two", "for three", "days", "yesterday", "week"] },
      { vi: "Hỏi cách dùng thuốc", kw: ["how often", "how many", "when should", "twice", "times a day", "how do i take", "after meals"] },
    ],
    twist: { vi: "Thuốc bạn cần đang hết hàng", instruction: "Say the medicine they need is out of stock. Offer an alternative and let them ask questions." },
  },
  9: {
    tasks: [
      { vi: "Hỏi thăm (How's it going?...)", kw: ["how's it going", "how are you", "how have you been", "what's up"] },
      { vi: "Kể sở thích", kw: ["i'm into", "i like", "i love", "i enjoy", "free time"] },
      { vi: "Nêu ý kiến (I think / In my opinion)", kw: ["i think", "in my opinion", "i feel", "i believe", "personally"] },
    ],
    twist: { vi: "Pip có ý kiến ngược với bạn", instruction: "Politely disagree with the learner's first opinion and give your own reason, so they practice agreeing or disagreeing." },
  },
  10: {
    tasks: [
      { vi: "Nhận lời hoặc từ chối khéo", kw: ["i'd love to", "i would love", "i'm afraid", "maybe another time", "sounds perfect", "sounds great"] },
      { vi: "Đề xuất thời gian khác", kw: ["how about", "what about", "another time", "next week", "maybe on"] },
      { vi: "Chốt hẹn", kw: ["see you", "let me know", "works for me", "it's a plan", "deal"] },
    ],
    twist: { vi: "Mallow rủ đúng lúc bạn bận", instruction: "Invite the learner to something early on a weekday morning, when they are probably busy, so they must decline politely and suggest another time." },
  },
  11: {
    tasks: [
      { vi: "Mở đầu câu chuyện", kw: ["guess what", "you won't believe", "yesterday", "last week", "last weekend", "the other day"] },
      { vi: "Dùng từ nối (first, then, suddenly)", kw: ["first", "then", "after that", "next", "suddenly"] },
      { vi: "Kết thúc câu chuyện", kw: ["in the end", "finally", "at last"] },
    ],
    twist: { vi: "Kero hỏi chi tiết liên tục", instruction: "Keep asking follow-up questions about small details (who, where, what time) so the learner must add details." },
  },
  12: {
    tasks: [
      { vi: "Nêu vấn đề lịch sự", kw: ["i'm afraid", "there's a problem", "there is a problem", "excuse me"] },
      { vi: "Nói bạn đã gọi/đặt gì", kw: ["i ordered", "i booked", "i asked for"] },
      { vi: "Đề xuất cách xử lý", kw: ["refund", "instead", "change", "replace", "new one", "could you"] },
    ],
    twist: { vi: "Lúc đầu Miso cho rằng bạn gọi nhầm", instruction: "At first, politely suggest that the learner may have ordered the wrong thing. Let them explain calmly before you agree to fix it." },
  },
  13: {
    tasks: [
      { vi: "Giới thiệu bản thân", kw: ["i'm", "i am", "my name", "i've worked", "i have worked", "i work"] },
      { vi: "Nêu điểm mạnh", kw: ["i'm good at", "good at", "strength", "i can"] },
      { vi: "Đặt câu hỏi cho nhà tuyển dụng", kw: ["could you tell me", "can i ask", "what does", "what is the", "how many", "what are the", "is there"] },
    ],
    twist: { vi: "Câu hỏi tình huống khó", instruction: "Ask one tricky situational question: 'Tell me about a time you made a mistake at work.'" },
  },
};

// ───────────── Câu khung bổ sung (nêu ý kiến, câu giờ) ─────────────

export const PHRASE_EXTRAS: Record<number, { en: string; vi: string }[]> = {
  2: [
    { en: "Hmm, let me think...", vi: "Để mình nghĩ chút..." },
    { en: "That's a good question.", vi: "Câu hỏi hay đấy." },
  ],
  9: [
    { en: "In my opinion, it's a great idea.", vi: "Theo mình, đó là ý hay." },
    { en: "I couldn't agree more.", vi: "Mình hoàn toàn đồng ý." },
    { en: "I'm not so sure about that.", vi: "Mình không chắc lắm về điều đó." },
  ],
  10: [
    { en: "That's a good point.", vi: "Ý đó hay đấy." },
    { en: "I see your point, but I prefer staying home.", vi: "Mình hiểu ý bạn, nhưng mình thích ở nhà hơn." },
  ],
  11: [
    { en: "To be honest, I think it was a bit boring.", vi: "Thật lòng, mình thấy hơi chán." },
    { en: "I see what you mean.", vi: "Mình hiểu ý bạn." },
  ],
};

// ───────────── Chuyện riêng của NPC (mở theo độ thân thiết) ─────────────

export const NPC_STORIES: Partial<Record<NpcId, { en: string; vi: string }[]>> = {
  miso: [
    { en: "I opened this café five years ago. Before that, I was a sailor!", vi: "Mình mở quán này 5 năm trước. Trước đó mình là thuỷ thủ đấy!" },
    { en: "My secret? I warm the cups before I pour the coffee.", vi: "Bí quyết à? Mình hâm nóng ly trước khi rót cà phê." },
    { en: "Every morning I wake up at five to bake croissants.", vi: "Sáng nào mình cũng dậy lúc 5 giờ để nướng bánh sừng bò." },
    { en: "Honestly, I can't drink coffee after 3 pm. I can't sleep!", vi: "Thật ra mình không uống được cà phê sau 3 giờ chiều. Mất ngủ luôn!" },
    { en: "One day I want to open a second café on the other side of the island. Will you help me?", vi: "Một ngày nào đó mình muốn mở quán thứ hai ở bên kia đảo. Bạn giúp mình nhé?" },
  ],
  mallow: [
    { en: "I grow all these carrots in my own garden.", vi: "Cà rốt ở đây đều do mình tự trồng." },
    { en: "I'm saving money to buy a little truck for the market.", vi: "Mình đang để dành tiền mua một chiếc xe tải nhỏ chở hàng." },
    { en: "Secret: purple carrots are sweeter than orange ones!", vi: "Bí mật nè: cà rốt tím ngọt hơn cà rốt cam đó!" },
    { en: "I was really shy before. Talking to customers helped me a lot.", vi: "Trước đây mình nhút nhát lắm. Nói chuyện với khách giúp mình nhiều." },
    { en: "Next spring, I'm going to teach a gardening class. Come and join!", vi: "Mùa xuân tới mình sẽ mở lớp làm vườn. Đến học nhé!" },
  ],
  pip: [
    { en: "Funny thing: I'm a penguin, but I can't fly. So I work with planes!", vi: "Buồn cười ghê: mình là chim cánh cụt mà không bay được. Nên mình làm với máy bay!" },
    { en: "My favorite time is sunset, when the last plane lands.", vi: "Lúc mình thích nhất là hoàng hôn, khi chuyến bay cuối hạ cánh." },
    { en: "I've been to twelve countries, but this island is home.", vi: "Mình đã đến 12 nước, nhưng hòn đảo này mới là nhà." },
    { en: "I get nervous before speaking in meetings too. Everybody does!", vi: "Mình cũng hồi hộp trước khi phát biểu trong cuộc họp. Ai cũng vậy mà!" },
    { en: "I'm learning Vietnamese! Xin chào! Did I say it right?", vi: "Mình đang học tiếng Việt đó! Xin chào! Mình nói đúng không?" },
  ],
  kero: [
    { en: "I've lived by this pond my whole life. I know every path on the island.", vi: "Mình sống cạnh hồ này cả đời rồi. Đường nào trên đảo mình cũng biết." },
    { en: "When I was young, I got lost in the forest for a whole day!", vi: "Hồi nhỏ mình từng bị lạc trong rừng cả ngày trời!" },
    { en: "My tip: when you don't understand, just ask. People like to help.", vi: "Mẹo của mình: không hiểu thì cứ hỏi. Mọi người thích giúp lắm." },
    { en: "I keep a diary in English. Three sentences every night.", vi: "Mình viết nhật ký bằng tiếng Anh. Mỗi tối ba câu." },
    { en: "You've come so far! I'm really proud of you, friend.", vi: "Bạn đã tiến bộ rất nhiều! Mình thật sự tự hào về bạn đó." },
  ],
};

/** Điểm thân thiết cần cho mỗi mức tim (0 → 5). */
export const FRIEND_LEVELS = [0, 3, 8, 15, 25, 40];

// ───────────── Xây đảo bằng XP ─────────────

export type BuildId = "flowers" | "bench" | "mailbox" | "lanterns" | "boat" | "windmill" | "balloon" | "arch";

export const BUILDS: { id: BuildId; lv: number; name: string; desc: string }[] = [
  { id: "flowers", lv: 2, name: "Luống hoa", desc: "Hoa nở quanh quảng trường" },
  { id: "bench", lv: 3, name: "Ghế gỗ ngắm cảnh", desc: "Chỗ ngồi tám chuyện cạnh hồ" },
  { id: "mailbox", lv: 4, name: "Hòm thư của Bơ", desc: "Thư từ bạn bè trên đảo" },
  { id: "lanterns", lv: 5, name: "Dây đèn lồng", desc: "Thắp sáng con đường buổi tối" },
  { id: "boat", lv: 6, name: "Thuyền nhỏ", desc: "Chèo thuyền trên Hồ Kero" },
  { id: "windmill", lv: 7, name: "Cối xay gió", desc: "Cối xay cạnh vườn rau của Mallow" },
  { id: "balloon", lv: 8, name: "Khinh khí cầu", desc: "Ngắm toàn đảo từ trên cao" },
  { id: "arch", lv: 10, name: "Cổng hoa lễ hội", desc: "Mừng bạn sắp “tốt nghiệp” đảo" },
];

// ───────────── Phát âm: cặp âm dễ lẫn của người Việt ─────────────

export interface SoundSet {
  id: string;
  title: string;
  tip: string;
  pairs: [string, string][];
}

export const SOUND_SETS: SoundSet[] = [
  { id: "i-ee", title: "/ɪ/ ngắn và /iː/ dài", tip: "/iː/ kéo dài, căng môi như đang cười. /ɪ/ ngắn, thả lỏng miệng.", pairs: [["ship", "sheep"], ["live", "leave"], ["bit", "beat"], ["fill", "feel"], ["sit", "seat"]] },
  { id: "th", title: "Âm th /θ/", tip: "Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi ra. Đừng đọc thành t hay s.", pairs: [["three", "tree"], ["thank", "tank"], ["think", "sink"], ["thin", "tin"], ["path", "pass"]] },
  { id: "end-s", title: "Âm cuối -s", tip: "Người Việt hay nuốt âm cuối. Kéo dài /s/ hoặc /z/ ở cuối danh từ số nhiều.", pairs: [["cat", "cats"], ["book", "books"], ["day", "days"], ["bag", "bags"], ["friend", "friends"]] },
  { id: "end-ed", title: "Đuôi -ed quá khứ", tip: "Bật nhẹ /t/ hoặc /d/ ở cuối: walked = /wɔːkt/, played = /pleɪd/.", pairs: [["walk", "walked"], ["play", "played"], ["watch", "watched"], ["cook", "cooked"], ["call", "called"]] },
  { id: "end-cons", title: "Phụ âm cuối t/d, k/g, p/b", tip: "Bật rõ phụ âm cuối. Âm hữu thanh (d, g, b) làm nguyên âm phía trước dài hơn.", pairs: [["bet", "bed"], ["cap", "cab"], ["right", "ride"], ["back", "bag"], ["seat", "seed"]] },
  { id: "l-n", title: "/l/ và /n/", tip: "/l/: đầu lưỡi chạm lợi trên, hơi đi ra hai bên. /n/: hơi đi qua mũi.", pairs: [["light", "night"], ["low", "no"], ["lock", "knock"], ["line", "nine"], ["lap", "nap"]] },
  { id: "s-sh", title: "/s/ và /ʃ/ (sh)", tip: "/ʃ/: tròn môi, lưỡi lùi về sau, như khi bảo người khác “suỵt”.", pairs: [["see", "she"], ["sip", "ship"], ["sell", "shell"], ["sort", "short"], ["save", "shave"]] },
];

/** Bộ âm gợi ý cho tuần (xoay vòng). */
export function soundSetForWeek(week: number): SoundSet {
  return SOUND_SETS[(Math.max(1, week) - 1) % SOUND_SETS.length];
}
