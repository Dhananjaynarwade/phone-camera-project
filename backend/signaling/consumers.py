import json

from channels.generic.websocket import AsyncWebsocketConsumer


class SignalingConsumer(AsyncWebsocketConsumer):

    # =====================================================
    # PAIRING ROOMS
    # pairing_id -> laptop channel
    # =====================================================

    pairing_rooms = {}

    # =====================================================
    # CONNECT
    # =====================================================

    async def connect(self):

        await self.accept()

        self.role = None
        self.pairing_id = None
        self.partner_channel = None

        print(
            "WebSocket connected:",
            self.channel_name
        )

        await self.send(
            text_data=json.dumps({
                "type": "connection",
                "message": "WebSocket connected"
            })
        )

    # =====================================================
    # DISCONNECT
    # =====================================================

    async def disconnect(self, close_code):

        pairing_id = getattr(
            self,
            "pairing_id",
            None
        )

        # Remove pairing if this device created it
        if pairing_id:

            if (
                self.pairing_rooms.get(pairing_id)
                == self.channel_name
            ):

                del self.pairing_rooms[pairing_id]

                print(
                    "Pairing removed:",
                    pairing_id
                )

        print(
            "WebSocket disconnected:",
            self.channel_name
        )

    # =====================================================
    # RECEIVE MESSAGE
    # =====================================================

    async def receive(self, text_data):

        try:

            data = json.loads(text_data)

            message_type = data.get("type")

            print(
                "Received:",
                data
            )

            # =================================================
            # ROLE
            # =================================================

            if message_type == "role":

                self.role = data.get("role")

                print(
                    "User role:",
                    self.role
                )

                return

            # =================================================
            # LAPTOP CREATES PAIRING
            # =================================================

            if message_type == "pair-create":

                await self.create_pairing(data)

                return

            # =================================================
            # PHONE JOINS PAIRING
            # =================================================

            if message_type == "pair":

                await self.join_pairing(data)

                return

            # =================================================
            # WEBRTC OFFER / ANSWER / ICE
            # =================================================

            if message_type in [
                "offer",
                "answer",
                "ice-candidate"
            ]:

                await self.forward_signal(data)

                return

            # =================================================
            # UNKNOWN MESSAGE
            # =================================================

            print(
                "Unknown message type:",
                message_type
            )

        except json.JSONDecodeError:

            print(
                "❌ Invalid JSON received"
            )

    # =====================================================
    # CREATE PAIRING
    # LAPTOP
    # =====================================================

    async def create_pairing(self, data):

        pairing_id = data.get(
            "pairingId"
        )

        if not pairing_id:

            print(
                "❌ Pairing ID missing"
            )

            await self.send(
                text_data=json.dumps({
                    "type": "pairing-error",
                    "message": "Pairing ID missing"
                })
            )

            return

        # Save pairing

        self.pairing_id = pairing_id

        self.pairing_rooms[
            pairing_id
        ] = self.channel_name

        print(
            "================================="
        )

        print(
            "🔗 PAIRING CREATED"
        )

        print(
            "Pairing ID:",
            pairing_id
        )

        print(
            "Laptop:",
            self.channel_name
        )

        print(
            "================================="
        )

        # Tell laptop

        await self.send(
            text_data=json.dumps({
                "type": "pairing-created",
                "pairingId": pairing_id,
                "message": "Waiting for phone"
            })
        )

    # =====================================================
    # JOIN PAIRING
    # PHONE
    # =====================================================

    async def join_pairing(self, data):

        pairing_id = data.get(
            "pairingId"
        )

        if not pairing_id:

            print(
                "❌ Pairing ID missing"
            )

            await self.send(
                text_data=json.dumps({
                    "type": "pairing-error",
                    "message": "Pairing ID missing"
                })
            )

            return

        # Find laptop

        laptop_channel = self.pairing_rooms.get(
            pairing_id
        )

        if not laptop_channel:

            print(
                "❌ Pairing not found:",
                pairing_id
            )

            await self.send(
                text_data=json.dumps({
                    "type": "pairing-error",
                    "message": "Pairing ID not found"
                })
            )

            return

        # =================================================
        # SAVE PHONE INFORMATION
        # =================================================

        self.pairing_id = pairing_id

        self.partner_channel = laptop_channel

        print(
            "📱 Phone joined pairing:",
            pairing_id
        )

        # =================================================
        # TELL PHONE
        # =================================================

        await self.send(
            text_data=json.dumps({
                "type": "paired",
                "role": "sender",
                "message": "Phone paired with laptop"
            })
        )

        # =================================================
        # TELL LAPTOP
        # =================================================

        await self.channel_layer.send(

            laptop_channel,

            {
                "type": "phone_paired",

                "phone_channel":
                    self.channel_name
            }

        )

        print(
            "================================="
        )

        print(
            "✅ PAIRING SUCCESS"
        )

        print(
            "Pairing ID:",
            pairing_id
        )

        print(
            "Laptop:",
            laptop_channel
        )

        print(
            "Phone:",
            self.channel_name
        )

        print(
            "================================="
        )

    # =====================================================
    # PHONE PAIRED
    # THIS RUNS ON LAPTOP
    # =====================================================

    async def phone_paired(self, event):

        phone_channel = event[
            "phone_channel"
        ]

        # Save phone as laptop partner

        self.partner_channel = phone_channel

        print(
            "📱 Phone partner assigned:",
            phone_channel
        )

        # Tell Angular laptop

        await self.send(
            text_data=json.dumps({
                "type": "pairing",
                "data": {
                    "type": "paired",
                    "message": "Phone connected"
                }
            })
        )

    # =====================================================
    # FORWARD WEBRTC SIGNAL
    # =====================================================

    async def forward_signal(self, data):

        partner_channel = getattr(
            self,
            "partner_channel",
            None
        )

        if not partner_channel:

            print(
                "⚠️ No paired device found"
            )

            return

        # Send WebRTC signal directly
        # to paired device

        await self.channel_layer.send(

            partner_channel,

            {
                "type": "signal_message",

                "data": data
            }

        )

        print(
            "📤 Signal forwarded:",
            data.get("type")
        )

    # =====================================================
    # RECEIVE SIGNAL FROM CHANNEL LAYER
    # =====================================================

    async def signal_message(self, event):

        await self.send(

            text_data=json.dumps({

                "type": "signal",

                "data":
                    event["data"]

            })

        )

        print(
            "📨 Signal delivered to browser"
        )

    # =====================================================
    # CLEAR PAIRING
    # =====================================================

    async def clear_pairing(self):

        pairing_id = getattr(
            self,
            "pairing_id",
            None
        )

        if not pairing_id:
            return

        if (
            self.pairing_rooms.get(pairing_id)
            == self.channel_name
        ):

            del self.pairing_rooms[
                pairing_id
            ]

            print(
                "Pairing cleared:",
                pairing_id
            )
            