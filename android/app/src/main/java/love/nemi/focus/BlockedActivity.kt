package love.nemi.focus

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback

class BlockedActivity : ComponentActivity() {
  private lateinit var message: TextView

  override fun onResume() {
    super.onResume()
    presentationState.markVisible()
  }

  override fun onPause() {
    presentationState.markHidden()
    super.onPause()
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_blocked)
    message = findViewById(R.id.blocked_message)
    bindBlockName(intent)
    findViewById<Button>(R.id.back_to_focus).setOnClickListener {
      returnToFocus()
    }
    onBackPressedDispatcher.addCallback(
      this,
      object : OnBackPressedCallback(true) {
        override fun handleOnBackPressed() = returnToFocus()
      },
    )
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    bindBlockName(intent)
  }

  private fun bindBlockName(intent: Intent) {
    val blockName = intent.getStringExtra(EXTRA_BLOCK_NAME)
      ?: error("BlockedActivity requires a block name.")
    message.text = getString(R.string.blocked_message, blockName)
  }

  private fun returnToFocus() {
    startActivity(
      Intent(this, MainActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
    )
    finish()
  }

  companion object {
    const val EXTRA_BLOCK_NAME = "love.nemi.focus.extra.BLOCK_NAME"

    private val presentationState = BlockedPresentationState()

    internal val ownsForeground: Boolean
      get() = presentationState.ownsForeground

    internal fun markLaunchRequested() {
      presentationState.markLaunchRequested()
    }
  }
}

internal class BlockedPresentationState {
  @Volatile
  private var launchPending = false

  @Volatile
  private var visible = false

  val ownsForeground: Boolean
    get() = launchPending || visible

  fun markLaunchRequested() {
    launchPending = true
  }

  fun markVisible() {
    launchPending = false
    visible = true
  }

  fun markHidden() {
    visible = false
  }
}
