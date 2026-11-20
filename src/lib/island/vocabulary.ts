import type { Word } from "./curriculum";

export interface SpeakingChunk extends Word {
  prompt: string;
}

type Chunk = [en: string, vi: string, prompt: string, ex: string];
const decks: Record<number, Chunk[]> = {
  1: [
    ["I grew up in", "mình lớn lên ở", "Kể cho Pip biết bạn lớn lên ở đâu.", "I grew up in Da Nang."],
    ["I live near", "mình sống gần", "Mô tả một nơi gần nhà bạn.", "I live near the beach."],
    ["I'm really into", "mình rất thích", "Kể về một sở thích bạn mê.", "I'm really into photography."],
    ["in my free time", "lúc rảnh", "Kể bạn hay làm gì lúc rảnh.", "In my free time, I go for walks."],
    ["How about you", "còn bạn thì sao", "Sau khi tự giới thiệu, hãy hỏi lại Pip.", "I work from home. How about you?"],
    ["I've just moved here", "mình vừa chuyển đến đây", "Nói với hàng xóm rằng bạn mới chuyển đến.", "I've just moved here. Do you know a good café?"],
  ],
  2: [
    ["Can I get", "cho mình một… được không", "Gọi một đồ uống với Miso.", "Can I get an iced latte, please?"],
    ["with less sugar", "ít đường hơn", "Gọi trà sữa với ít đường.", "Can I get a milk tea with less sugar?"],
    ["without ice", "không đá", "Dặn Miso pha nước cam không đá.", "I'd like an orange juice without ice."],
    ["is there anything else", "còn gì nữa không", "Đóng vai chủ quán và hỏi khách có gọi thêm gì.", "Is there anything else I can get you?"],
    ["I'll have the same", "mình gọi giống vậy", "Gọi món giống người bạn đi cùng.", "I'll have the same, please."],
    ["I'm paying by card", "mình trả bằng thẻ", "Nói với Miso bạn sẽ dùng thẻ.", "I'm paying by card. Is that okay?"],
  ],
  3: [
    ["How much are these", "mấy món này bao nhiêu", "Hỏi giá mấy quả táo ở sạp Mallow.", "How much are these apples?"],
    ["Could I try", "mình thử… được không", "Xin thử một miếng xoài.", "Could I try a piece of mango?"],
    ["a little cheaper", "rẻ hơn một chút", "Hỏi xem có món nào rẻ hơn một chút.", "Do you have anything a little cheaper?"],
    ["half a kilo of", "nửa ký", "Mua nửa ký cà chua.", "I'd like half a kilo of tomatoes."],
    ["That's all for now", "tạm thời vậy thôi", "Báo với Mallow bạn đã chọn đủ.", "That's all for now, thank you."],
    ["keep the change", "khỏi thối lại", "Bảo người bán giữ tiền thừa.", "Here you are. Keep the change."],
  ],
  4: [
    ["How do I get to", "đi đến… bằng cách nào", "Hỏi Kero đường đến bến phà.", "How do I get to the ferry terminal?"],
    ["across from", "đối diện", "Nói bưu điện nằm đối diện công viên.", "The post office is across from the park."],
    ["at the next corner", "ở góc đường kế tiếp", "Chỉ khách rẽ trái ở góc đường kế tiếp.", "Turn left at the next corner."],
    ["within walking distance", "có thể đi bộ tới", "Hỏi xem chợ có gần đủ để đi bộ.", "Is the market within walking distance?"],
    ["I'm a bit lost", "mình hơi lạc đường", "Mở lời khi bạn đang lạc.", "I'm a bit lost. Could you help me?"],
    ["Could you show me on the map", "chỉ giúp mình trên bản đồ được không", "Nhờ Kero chỉ trên bản đồ.", "Could you show me on the map, please?"],
  ],
  5: [
    ["a reservation under", "đặt chỗ dưới tên", "Nói bạn đặt phòng dưới tên Lan.", "I have a reservation under Lan Nguyen."],
    ["Could I have a window seat", "cho tôi ghế cạnh cửa sổ được không", "Xin chỗ cạnh cửa sổ lúc làm thủ tục.", "Could I have a window seat, please?"],
    ["carry-on bag", "túi hành lý xách tay", "Nói bạn chỉ có một túi xách tay.", "I only have one carry-on bag."],
    ["What time is check-in", "mấy giờ nhận phòng", "Hỏi lễ tân giờ nhận phòng.", "What time is check-in today?"],
    ["Is breakfast included", "có bao gồm bữa sáng không", "Hỏi bữa sáng có trong giá phòng chưa.", "Is breakfast included in the price?"],
    ["Could you hold my luggage", "giữ hành lý giúp tôi được không", "Nhờ lễ tân giữ hành lý trước giờ nhận phòng.", "Could you hold my luggage until check-in?"],
  ],
  6: [
    ["a table for two", "bàn cho hai người", "Hỏi nhà hàng có bàn hai người.", "Do you have a table for two?"],
    ["What would you recommend", "bạn gợi ý món nào", "Hỏi nhân viên món nên gọi.", "What would you recommend for a main course?"],
    ["on the side", "để riêng", "Dặn để nước sốt riêng.", "Could I have the sauce on the side?"],
    ["I'm allergic to", "tôi dị ứng với", "Báo nhân viên bạn dị ứng đậu phộng.", "I'm allergic to peanuts."],
    ["Could we split the bill", "tụi tôi chia hóa đơn được không", "Xin trả tiền riêng cho hai người.", "Could we split the bill, please?"],
    ["Could I get this to go", "cho tôi gói món này mang về được không", "Nhờ gói phần đồ ăn còn lại.", "Could I get this to go, please?"],
  ],
  7: [
    ["I'm calling to", "tôi gọi để", "Mở đầu cuộc gọi đặt lịch.", "I'm calling to make an appointment."],
    ["Is there an opening", "còn khung giờ trống không", "Hỏi có chỗ trống vào chiều mai.", "Is there an opening tomorrow afternoon?"],
    ["Could we move it to", "mình dời sang… được không", "Xin dời lịch đến thứ Sáu.", "Could we move it to Friday?"],
    ["Could I leave a message", "tôi để lại lời nhắn được không", "Xin để lại lời nhắn khi người cần gặp vắng mặt.", "Could I leave a message for Kero?"],
    ["Could you call me back", "gọi lại giúp tôi được không", "Nhờ bên kia gọi lại sau.", "Could you call me back this afternoon?"],
    ["Let me read that back", "để tôi đọc lại", "Xác nhận bạn đã nghe đúng giờ hẹn.", "Let me read that back. Thursday at ten?"],
  ],
  8: [
    ["I've had a sore throat", "tôi bị đau họng", "Nói bạn đau họng hai ngày nay.", "I've had a sore throat for two days."],
    ["It hurts when I", "tôi đau khi", "Mô tả lúc nào bạn thấy đau.", "It hurts when I swallow."],
    ["Is there something for", "có thuốc gì cho… không", "Hỏi dược sĩ có thuốc cho cơn ho.", "Is there something for a cough?"],
    ["How often should I take it", "tôi nên uống bao lâu một lần", "Hỏi tần suất dùng thuốc.", "How often should I take it?"],
    ["with food", "cùng thức ăn", "Hỏi thuốc có nên uống cùng thức ăn.", "Should I take it with food?"],
    ["Are there any side effects", "có tác dụng phụ nào không", "Hỏi người hướng dẫn về tác dụng phụ.", "Are there any side effects I should know about?"],
  ],
  9: [
    ["How's your week going", "tuần này của bạn thế nào", "Hỏi thăm một người bạn mới.", "Hey! How's your week going?"],
    ["Have you been up to anything", "dạo này bạn có làm gì… không", "Mở chuyện bằng cách hỏi gần đây có việc gì vui.", "Have you been up to anything fun lately?"],
    ["That sounds like fun", "nghe vui đấy", "Phản hồi tích cực khi bạn kể vừa đi biển.", "That sounds like fun. Who did you go with?"],
    ["What got you into", "điều gì khiến bạn bắt đầu thích", "Hỏi vì sao người kia bắt đầu thích vẽ.", "What got you into painting?"],
    ["I've been meaning to", "mình đã định… từ lâu", "Kể bạn định thử một sở thích mới.", "I've been meaning to try yoga."],
    ["Same here", "mình cũng vậy", "Tiếp chuyện khi cả hai cùng thích nấu ăn.", "Same here. I cook most weekends."],
  ],
  10: [
    ["Would you be up for", "bạn có muốn… không", "Rủ một người bạn đi ăn trưa.", "Would you be up for lunch this Saturday?"],
    ["I'd love to, but", "mình rất muốn, nhưng", "Từ chối lịch sự vì đã có hẹn.", "I'd love to, but I already have plans."],
    ["How about another day", "hay là hôm khác", "Đề nghị chuyển sang một ngày khác.", "How about another day? I'm free on Sunday."],
    ["That works for me", "giờ đó hợp với mình", "Xác nhận giờ hẹn phù hợp.", "Three o'clock? That works for me."],
    ["Let me get back to you", "để mình trả lời bạn sau", "Hẹn báo lại sau khi xem lịch.", "Let me get back to you after I check my calendar."],
    ["Shall we meet at", "mình gặp nhau lúc/ở… nhé", "Chốt địa điểm hẹn.", "Shall we meet at the café?"],
  ],
  11: [
    ["It all started when", "mọi chuyện bắt đầu khi", "Mở đầu chuyện lỡ chuyến tàu.", "It all started when I missed my train."],
    ["on my way to", "trên đường đến", "Kể đã gặp ai trên đường đi làm.", "I saw an old friend on my way to work."],
    ["out of nowhere", "bất thình lình", "Kể một chuyện xảy ra bất ngờ.", "A dog ran across the road out of nowhere."],
    ["It turned out that", "hóa ra là", "Kể điều bạn chỉ phát hiện sau đó.", "It turned out that I was at the wrong station."],
    ["In the end", "cuối cùng thì", "Kể kết quả cuối cùng của câu chuyện.", "In the end, I got there on time."],
    ["Looking back", "nghĩ lại thì", "Chia sẻ cảm xúc khi nhìn lại.", "Looking back, it was pretty funny."],
  ],
  12: [
    ["I'm afraid there's been a mix-up", "hình như có nhầm lẫn", "Mở lời lịch sự khi được đưa nhầm món.", "I'm afraid there's been a mix-up with my order."],
    ["I ordered", "tôi đã gọi", "Nhắc lại món đã gọi.", "I ordered iced coffee, but this is hot tea."],
    ["Could you replace it", "đổi món này giúp tôi được không", "Xin đổi một món bị lỗi.", "Could you replace it with the dish I ordered?"],
    ["Is there anything you can do", "bạn có thể giúp gì được không", "Hỏi nhân viên có cách xử lý vấn đề.", "Is there anything you can do about the delay?"],
    ["I'd rather have", "tôi thích chọn… hơn", "Chọn hoàn tiền thay vì đổi hàng.", "I'd rather have a refund, please."],
    ["I appreciate your help", "cảm ơn bạn đã giúp", "Cảm ơn sau khi được xử lý sự cố.", "I appreciate your help. That's resolved the issue."],
  ],
  13: [
    ["I have experience with", "tôi có kinh nghiệm về", "Nêu một việc bạn từng làm trong công việc.", "I have experience with customer support."],
    ["I was responsible for", "tôi phụ trách", "Kể rõ trách nhiệm ở vị trí trước.", "I was responsible for training new staff."],
    ["One of my strengths is", "một điểm mạnh của tôi là", "Nêu một điểm mạnh kèm ví dụ.", "One of my strengths is staying calm under pressure."],
    ["A good example is when", "một ví dụ là khi", "Mở đầu câu chuyện minh họa cho kỹ năng của bạn.", "A good example is when I helped a customer solve a problem."],
    ["I'd like to learn more about", "tôi muốn tìm hiểu thêm về", "Hỏi nhà tuyển dụng về công việc hằng ngày.", "I'd like to learn more about a typical day on the team."],
    ["What are the next steps", "các bước tiếp theo là gì", "Hỏi về bước tiếp theo cuối buổi phỏng vấn.", "What are the next steps in the hiring process?"],
  ],
};

export function vocabularyFor(chapter: number): SpeakingChunk[] {
  return (decks[chapter] ?? []).map(([en, vi, prompt, ex]) => ({ en, vi, prompt, ex }));
}

export const VOCABULARY_COUNT = Object.values(decks).reduce((total, deck) => total + deck.length, 0);

function normalized(text: string): string {
  return text.toLowerCase().replace(/’/g, "'")
    .replace(/\bi'm\b/g, "i am").replace(/\bi'd\b/g, "i would")
    .replace(/\bi've\b/g, "i have").replace(/\bi'll\b/g, "i will")
    .replace(/\bwhat's\b/g, "what is").replace(/\bhow's\b/g, "how is")
    .replace(/\bthat's\b/g, "that is").replace(/\bthere's\b/g, "there has")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

/** Chấm việc nhớ cụm từ. Người học có thể đặt cụm đó trong một câu của chính mình. */
export function includesSpeakingChunk(answer: string, chunk: string): boolean {
  const target = normalized(chunk);
  return Boolean(target && ` ${normalized(answer)} `.includes(` ${target} `));
}
