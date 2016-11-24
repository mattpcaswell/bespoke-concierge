import { Component, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { FBData, PushResult } from "nativescript-plugin-firebase";
import { ListView } from "ui/list-view";
import { FromNowPipe } from '../../pipes/fromnow.pipe';
import { ChatService } from "../../services/chatServices/chat.service";
import { UserIdService } from "../../services/userId.service";
import { TextService } from "../../services/text.service";
import { Message } from "../../services/chatServices/message";

@Component({
    selector: 'chat',
    templateUrl: 'pages/chat/chat.html',
    styleUrls: ['pages/chat/chat.css'],
})


export class ChatComponent {

    messages: Message[] = new Array<Message>();
    newMessage: string;
    userID: string;
    room: string = "default";
    loading: boolean = true;



    @ViewChild("listview") listView;

    constructor(private _chatService: ChatService, private _userIdService: UserIdService, ngZone: NgZone, private _textService: TextService) {
        var that = this;

        this.messages = new Array<Message>();

        //get userId and then get messages for that userID from the server
        that._userIdService.getUserId()
            .then((userID: string) => {
                that.userID = userID;

                that._chatService.subscribeToMessages(that.userID, that.room,
                    (data: FBData) => {
                        //use ngZone run because this method gets called outside of angular's zone so you gotta nudge it to update the screen
                        ngZone.run(() => {
                            that.loading = false;
                            if (data.value) {
                                that.messages = new Array<Message>();
                                Object.keys(data.value).forEach(function (key) {
                                    var message: Message = data.value[key];
                                    that.messages.push(message);
                                });
                                //sort messages by time sent
                                that.messages.sort(function (a, b) {
                                    var c = new Date(a.timeStamp);
                                    var d = new Date(b.timeStamp);
                                    return c > d ? 1 : c < d ? -1 : 0;
                                });

                                setTimeout(function () {
                                    that.listView._elementRef.nativeElement.scrollToIndex(that.messages.length - 1);
                                }, 0);
                            }
                        });
                    });
            })
            .catch((error: any) => {
                console.log("Error getting userID");
                console.log(error);
            });
    }

    addMessage(text) {
        if (text) {
            console.log("+++++++++++ message: " + text + "  sender: " + this.userID);
            var message: Message = { text: text, timeStamp: Date.now(), sender: this.userID };
            this.messages.push(message);
            this._chatService.sendMessage(message, this.userID, this.room)
                .catch((error: any) => {
                    console.log(error);
                    alert(this._textService.getText().chatError);
                });
            this.newMessage = '';
        }
    }

    isMessageFromMe(message: Message): boolean {
        return message.sender === this.userID;
    }
}
