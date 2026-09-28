package com.danielatriana.chatapi;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @MessageMapping("/mensaje")
    @SendTo("/topic/mensajes")
    public String enviarMensaje(String mensaje) {

        return mensaje;
    }
}
