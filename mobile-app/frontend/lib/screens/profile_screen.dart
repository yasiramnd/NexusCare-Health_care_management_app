import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Patient Profile"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [

            Text(
              "Patient Information",
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),

            SizedBox(height: 20),

            Text("Full Name: Dilukshi Warangana"),
            SizedBox(height: 10),

            Text("NIC: 2004XXXXXXXX"),
            SizedBox(height: 10),

            Text("Date of Birth: 2004-01-01"),
            SizedBox(height: 10),

            Text("Gender: Female"),

          ],
        ),
      ),
    );
  }
}