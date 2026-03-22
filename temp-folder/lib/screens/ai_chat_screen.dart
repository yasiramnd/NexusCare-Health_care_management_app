import 'package:flutter/material.dart';
import '../theme/nexus_theme.dart';

class AiChatScreen extends StatefulWidget {
  const AiChatScreen({super.key});
  @override
  State<AiChatScreen> createState() => _AiChatScreenState();
}

class _AiChatScreenState extends State<AiChatScreen> {
  final _controller  = TextEditingController();
  final _scroll      = ScrollController();
  final List<_ChatMsg> _msgs = [];
  bool _typing = false;
  String _lang = 'English';

  @override
  void initState() {
    super.initState();
    _msgs.add(_ChatMsg(
      text: 'Hello! I am your NexusCare AI Health Assistant. I can help you understand your symptoms, explain your medical records, and provide health guidance.\n\nPlease note: I provide guidance only — not medical diagnoses. Always consult a doctor for medical decisions.',
      isUser: false,
    ));
  }

  @override
  void dispose() { _controller.dispose(); _scroll.dispose(); super.dispose(); }

  Future<void> _send() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    _controller.clear();
    setState(() { _msgs.add(_ChatMsg(text: text, isUser: true)); _typing = true; });
    _scrollToBottom();

    // Simulate AI response based on keywords in the backend's RAG pipeline
    await Future.delayed(const Duration(milliseconds: 1200));
    if (!mounted) return;

    final reply = _generateReply(text);
    setState(() { _typing = false; _msgs.add(_ChatMsg(text: reply, isUser: false)); });
    _scrollToBottom();
  }

  String _generateReply(String input) {
    final q = input.toLowerCase();
    if (q.contains('blood') || q.contains('pressure')) {
      return 'Based on your records, you have been diagnosed with **Hypertension Stage 1**. Your doctor has prescribed Amlodipine 5mg daily.\n\n📋 Tips:\n• Monitor BP daily\n• Reduce sodium intake\n• Exercise 30 min/day\n• Avoid stress\n\nYour last reading trend suggests the medication is working well. Continue as prescribed.';
    } else if (q.contains('diabetes') || q.contains('sugar') || q.contains('hba1c')) {
      return 'Your latest HbA1c is **6.8%**, which indicates well-controlled Type 2 Diabetes. You are on Metformin 500mg twice daily.\n\n📋 Recommendations:\n• Check fasting glucose weekly\n• Follow a low-glycaemic diet\n• Avoid sugary drinks\n• Keep your next review appointment\n\n⚠️ In emergencies, carry glucose tablets as you may be prone to hypoglycaemia.';
    } else if (q.contains('allerg')) {
      return '⚠️ Your recorded allergies are:\n\n• **Penicillin** — antibiotic\n• **Sulfa drugs** — sulfonamide antibiotics\n\nAlways inform any new doctor or pharmacist about these before receiving any medication. These are also stored in your Emergency QR profile.';
    } else if (q.contains('headache') || q.contains('pain')) {
      return 'Headaches can have several causes. Given your history of hypertension, an elevated blood pressure could be a contributing factor.\n\n🔍 Immediate steps:\n• Check your blood pressure\n• Rest in a quiet, dark room\n• Stay hydrated\n• Take your Amlodipine if due\n\n⚠️ Seek immediate care if the headache is sudden, severe, or accompanied by vision changes or chest pain.';
    } else if (q.contains('prescri') || q.contains('medicine') || q.contains('medication')) {
      return 'You currently have **2 active prescriptions**:\n\n💊 **Amlodipine 5mg** — Once daily (for blood pressure)\n💊 **Metformin 500mg** — Twice daily (for diabetes)\n\nYou can order these from a registered pharmacy directly through the NexusCare app. Tap "Order Medicine" on your dashboard.';
    } else if (q.contains('appointment') || q.contains('doctor') || q.contains('book')) {
      return 'You can book an appointment with any registered doctor through the **Appointments** section.\n\nAvailable specialists include:\n• Dr. Amara Silva — General Medicine\n• Dr. Nimal Perera — Cardiology\n• Dr. Chamara Fernando — Endocrinology\n\nWould you like me to help you choose the right specialist based on your condition?';
    } else {
      return 'Thank you for your question. Based on your NexusCare health profile, I can provide personalised guidance about:\n\n• 🩺 Your diagnosed conditions\n• 💊 Your current medications\n• ⚠️ Your allergies & risks\n• 📅 Appointment recommendations\n\nCould you describe your symptoms or what you\'d like to know more about?';
    }
  }

  void _scrollToBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
    if (_scroll.hasClients) _scroll.animateTo(_scroll.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
  });

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Row(children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: Color(0xFF7B2D8B),
          child: Icon(Icons.psychology, color: Colors.white, size: 16),
        ),
        SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('AI Health Assistant', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          Text('Powered by NexusCare RAG', style: TextStyle(fontSize: 10, color: NexusTheme.textMed)),
        ]),
      ]),
      actions: [
        PopupMenuButton<String>(
          onSelected: (v) => setState(() => _lang = v),
          itemBuilder: (_) => ['English', 'Sinhala', 'Tamil'].map((l) => PopupMenuItem(value: l, child: Text(l))).toList(),
          child: Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF7B2D8B).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.language, size: 14, color: Color(0xFF7B2D8B)),
              const SizedBox(width: 4),
              Text(_lang, style: const TextStyle(fontSize: 12, color: Color(0xFF7B2D8B), fontWeight: FontWeight.w600)),
            ]),
          ),
        ),
      ],
    ),
    body: Column(children: [
      // Medical context banner
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: const Color(0xFF7B2D8B).withOpacity(0.06),
        child: const Row(children: [
          Icon(Icons.lock_outline, size: 13, color: Color(0xFF7B2D8B)),
          SizedBox(width: 6),
          Expanded(child: Text('Context-aware — using your medical history securely',
              style: TextStyle(fontSize: 11, color: Color(0xFF7B2D8B)))),
        ]),
      ),

      // Messages
      Expanded(
        child: ListView.builder(
          controller: _scroll,
          padding: const EdgeInsets.all(16),
          itemCount: _msgs.length + (_typing ? 1 : 0),
          itemBuilder: (_, i) {
            if (_typing && i == _msgs.length) return _buildTypingIndicator();
            return _buildBubble(_msgs[i]);
          },
        ),
      ),

      // Quick prompts
      if (_msgs.length == 1)
        SizedBox(
          height: 48,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              'What are my allergies?',
              'Explain my diabetes',
              'Check my BP history',
              'My headache symptoms',
            ].map((q) => GestureDetector(
              onTap: () { _controller.text = q; _send(); },
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF7B2D8B).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFF7B2D8B).withOpacity(0.2)),
                ),
                child: Text(q, style: const TextStyle(fontSize: 12, color: Color(0xFF7B2D8B), fontWeight: FontWeight.w500)),
              ),
            )).toList(),
          ),
        ),

      // Input bar
      Container(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 24),
        color: Colors.white,
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Describe your symptoms...',
                hintStyle: const TextStyle(color: NexusTheme.textLight),
                filled: true, fillColor: NexusTheme.surface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              ),
              onSubmitted: (_) => _send(),
              maxLines: null,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _send,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(color: Color(0xFF7B2D8B), shape: BoxShape.circle),
              child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ]),
      ),
    ]),
  );

  Widget _buildBubble(_ChatMsg msg) => Align(
    alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
    child: Container(
      constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: msg.isUser ? const Color(0xFF7B2D8B) : Colors.white,
        borderRadius: BorderRadius.only(
          topLeft:     const Radius.circular(18),
          topRight:    const Radius.circular(18),
          bottomLeft:  Radius.circular(msg.isUser ? 18 : 4),
          bottomRight: Radius.circular(msg.isUser ? 4 : 18),
        ),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0, 2))],
        border: msg.isUser ? null : Border.all(color: NexusTheme.divider),
      ),
      child: Text(msg.text,
          style: TextStyle(color: msg.isUser ? Colors.white : NexusTheme.textDark, fontSize: 14, height: 1.5)),
    ),
  );

  Widget _buildTypingIndicator() => Align(
    alignment: Alignment.centerLeft,
    child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white, borderRadius: BorderRadius.circular(18),
        border: Border.all(color: NexusTheme.divider),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: List.generate(3, (i) => AnimatedContainer(
        duration: Duration(milliseconds: 300 + i * 150),
        margin: const EdgeInsets.symmetric(horizontal: 2),
        width: 7, height: 7,
        decoration: const BoxDecoration(color: Color(0xFF7B2D8B), shape: BoxShape.circle),
      ))),
    ),
  );
}

class _ChatMsg {
  final String text;
  final bool   isUser;
  const _ChatMsg({required this.text, required this.isUser});
}
