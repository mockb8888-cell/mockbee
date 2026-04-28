import sys
sys.path.insert(0, './backend')
import mocker

system_prompt = mocker.PHASE_PROMPTS["self_intro"].format(role="Python Developer", level="Mid-level", q_target=2)
history = [{"role": "user", "content": "Please begin the interview."}]

try:
    reply = mocker.ai_chat(system_prompt, history)
    print("REPLY:")
    print(reply)
except Exception as e:
    print("ERROR:", e)
