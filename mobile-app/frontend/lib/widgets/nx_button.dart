import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Reusable gradient primary button.
class NxButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final Color? color;

  const NxButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity, height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: color == null
              ? const LinearGradient(
                  colors: [Color(0xFF1E6FFF), Color(0xFF0A3DB0)],
                  begin: Alignment.centerLeft, end: Alignment.centerRight)
              : LinearGradient(colors: [color!, color!]),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: const Color(0xFF1E6FFF).withOpacity(0.3),
                blurRadius: 16, offset: const Offset(0, 4)),
          ],
        ),
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: loading ? null : onPressed,
          child: loading
              ? const SizedBox(
                  width: 22, height: 22,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.white))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[Icon(icon, size: 18), const SizedBox(width: 8)],
                    Text(label, style: GoogleFonts.inter(
                        fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
                  ],
                ),
        ),
      ),
    );
  }
}

/// Small outlined secondary button.
class NxOutlinedButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  const NxOutlinedButton({
    super.key, required this.label, this.onPressed, this.icon});

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: icon != null ? Icon(icon, size: 16, color: const Color(0xFF60A5FA)) : const SizedBox.shrink(),
      label: Text(label, style: GoogleFonts.inter(
          fontSize: 13, color: const Color(0xFF60A5FA), fontWeight: FontWeight.w500)),
      style: OutlinedButton.styleFrom(
        side: const BorderSide(color: Color(0xFF1D4ED8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }
}
