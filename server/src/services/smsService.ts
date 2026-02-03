import config from "@/config";
import axios from "axios";

export async function sendTicketCode(phone: string, ticketCodes: string[]) {
  const messageText = `TICKET\n\n ${ticketCodes.join("\n")}`;
  const encodeMessage = encodeURIComponent(messageText);

  const response = await axios.get(
    `${config.arkesel.url}&api_key=${config.arkesel.apiKey}&to=${phone}&from=${config.arkesel.sender}&sms=${encodeMessage}`,
  );
  console.log(response.data);
  return response.data;
}
