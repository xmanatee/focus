package love.nemi.focus

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class BlockedActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val blockName = intent.getStringExtra(EXTRA_BLOCK_NAME) ?: "Focus Block"
    val layout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setBackgroundColor(SURFACE)
      setPadding(48, 48, 48, 48)
      layoutParams = LinearLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
      )
    }

    layout.addView(TextView(this).apply {
      text = "Blocked"
      textSize = 34f
      setTextColor(INK)
      gravity = Gravity.CENTER
      setTypeface(typeface, android.graphics.Typeface.BOLD)
    })
    layout.addView(TextView(this).apply {
      text = "\"$blockName\" is active right now."
      textSize = 18f
      setTextColor(MUTED)
      gravity = Gravity.CENTER
      setPadding(0, 18, 0, 32)
    })
    layout.addView(Button(this).apply {
      text = "Back to Focus Blocks"
      setOnClickListener {
        packageManager.getLaunchIntentForPackage(packageName)?.let { intent ->
          intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
          startActivity(intent)
        }
        finish()
      }
    })

    setContentView(layout)
  }

  companion object {
    const val EXTRA_BLOCK_NAME = "love.nemi.focus.extra.BLOCK_NAME"
    private val SURFACE = Color.rgb(248, 242, 232)
    private val INK = Color.rgb(43, 34, 26)
    private val MUTED = Color.rgb(122, 109, 95)
  }
}
