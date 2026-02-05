-- Insert sample evaluation prompts for testing
-- This script inserts 50 prompts with varying defiance levels

-- Replace 'YOUR_PROJECT_ID' with actual project ID
DO $$
DECLARE
  project_uuid UUID := 'YOUR_PROJECT_ID'; -- Update this!
BEGIN
  -- Cooperative prompts (10)
  INSERT INTO soundflare_evaluation_prompts (project_id, prompt, defiance_level, expected_behavior, sequence_order) VALUES
  (project_uuid, 'Hi, I''d like to schedule an appointment for next week. What times are available?', 'Cooperative', 'Agent should check availability and offer time slots', 1),
  (project_uuid, 'Can you help me update my contact information?', 'Cooperative', 'Agent should guide through update process', 2),
  (project_uuid, 'I need to reschedule my appointment from Tuesday to Thursday.', 'Cooperative', 'Agent should confirm change and update booking', 3),
  (project_uuid, 'What are your business hours?', 'Cooperative', 'Agent should provide accurate business hours', 4),
  (project_uuid, 'I''d like to know more about your services.', 'Cooperative', 'Agent should explain services clearly', 5),
  (project_uuid, 'Can you send me a confirmation email?', 'Cooperative', 'Agent should confirm email will be sent', 6),
  (project_uuid, 'I''m calling to confirm my appointment tomorrow at 2 PM.', 'Cooperative', 'Agent should verify appointment details', 7),
  (project_uuid, 'What payment methods do you accept?', 'Cooperative', 'Agent should list accepted payment methods', 8),
  (project_uuid, 'Is there parking available at your location?', 'Cooperative', 'Agent should provide parking information', 9),
  (project_uuid, 'Can I book an appointment for two people?', 'Cooperative', 'Agent should accommodate group booking', 10),

  -- Hesitant prompts (10)
  (project_uuid, 'Um, I''m not sure if I need an appointment... maybe I should just walk in?', 'Hesitant', 'Agent should clarify benefits of appointment vs walk-in', 11),
  (project_uuid, 'I want to book something, but I''m worried about the cost. Can you tell me prices first?', 'Hesitant', 'Agent should provide pricing information reassuringly', 12),
  (project_uuid, 'I''m thinking about canceling my appointment... I''m not sure if I have time.', 'Hesitant', 'Agent should offer to reschedule instead', 13),
  (project_uuid, 'Do I really need to provide all my information right now? Can I do it later?', 'Hesitant', 'Agent should explain necessity while offering flexibility', 14),
  (project_uuid, 'I heard mixed reviews... are you sure this is right for me?', 'Hesitant', 'Agent should address concerns professionally', 15),
  (project_uuid, 'Maybe I should call back tomorrow when I have more time to decide.', 'Hesitant', 'Agent should encourage decision while respecting choice', 16),
  (project_uuid, 'I''m not great with technology... will this be complicated?', 'Hesitant', 'Agent should reassure about simplicity of process', 17),
  (project_uuid, 'What if I need to cancel last minute? Is there a fee?', 'Hesitant', 'Agent should explain cancellation policy clearly', 18),
  (project_uuid, 'I''ve never done this before... can you walk me through everything?', 'Hesitant', 'Agent should offer patient guidance', 19),
  (project_uuid, 'Are you sure my information will be kept private?', 'Hesitant', 'Agent should reassure about privacy/security', 20),

  -- Evasive prompts (10)
  (project_uuid, 'I don''t want to give my full name, can''t I just use my first name?', 'Evasive', 'Agent should explain requirement while being understanding', 21),
  (project_uuid, 'Why do you need my phone number? I''d rather not share that.', 'Evasive', 'Agent should justify data collection professionally', 22),
  (project_uuid, 'Can''t I just come in without booking? I don''t like giving out my details.', 'Evasive', 'Agent should balance policy with customer comfort', 23),
  (project_uuid, 'I''ll think about it and maybe book online later myself.', 'Evasive', 'Agent should offer to help now while respecting choice', 24),
  (project_uuid, 'That''s a lot of questions. Do you really need all of this information?', 'Evasive', 'Agent should explain each requirement briefly', 25),
  (project_uuid, 'I''d prefer to talk to someone in person instead of over the phone.', 'Evasive', 'Agent should offer in-person option while attempting to help', 26),
  (project_uuid, 'Can you just tell me what I need to know without all the details?', 'Evasive', 'Agent should provide concise information', 27),
  (project_uuid, 'I''m just browsing really, not ready to commit to anything.', 'Evasive', 'Agent should provide information without pressure', 28),
  (project_uuid, 'Let me talk to my spouse first and I''ll call back.', 'Evasive', 'Agent should leave door open for future contact', 29),
  (project_uuid, 'Do you have a website where I can read all this myself?', 'Evasive', 'Agent should provide website while offering to assist', 30),

  -- Defiant prompts (10)
  (project_uuid, 'This is ridiculous. Why can''t you just give me an appointment without all this hassle?', 'Defiant', 'Agent should remain calm and explain process', 31),
  (project_uuid, 'I don''t see why I need to book in advance. Your system is too complicated.', 'Defiant', 'Agent should defend policy while acknowledging frustration', 32),
  (project_uuid, 'Every other place lets me do this without jumping through hoops. What''s your problem?', 'Defiant', 'Agent should explain unique requirements professionally', 33),
  (project_uuid, 'I''m not giving you my email address. You''ll just spam me.', 'Defiant', 'Agent should assure no spam while explaining email necessity', 34),
  (project_uuid, 'This is taking too long. Can''t you speed this up?', 'Defiant', 'Agent should acknowledge time concern and expedite where possible', 35),
  (project_uuid, 'I don''t trust giving my credit card over the phone. That''s not secure.', 'Defiant', 'Agent should explain security measures confidently', 36),
  (project_uuid, 'Your prices are too high compared to competitors. Why should I choose you?', 'Defiant', 'Agent should justify value proposition', 37),
  (project_uuid, 'I want to speak to your manager right now. You''re not helping.', 'Defiant', 'Agent should attempt to resolve before escalating', 38),
  (project_uuid, 'This policy is stupid. Who came up with this?', 'Defiant', 'Agent should professionally defend company policy', 39),
  (project_uuid, 'I''ve been on hold forever and now you''re asking me all these questions?', 'Defiant', 'Agent should apologize for wait and expedite process', 40),

  -- Hostile prompts (10)
  (project_uuid, 'You people are completely incompetent! I want to file a complaint!', 'Hostile', 'Agent should remain calm, de-escalate, offer resolution', 41),
  (project_uuid, 'This is the worst customer service I''ve ever experienced. You should be fired!', 'Hostile', 'Agent should not take personally, remain professional', 42),
  (project_uuid, 'Are you stupid? I''ve told you three times what I want!', 'Hostile', 'Agent should stay composed, clarify understanding', 43),
  (project_uuid, 'I''m going to leave a terrible review everywhere unless you fix this immediately!', 'Hostile', 'Agent should focus on solution, not threat', 44),
  (project_uuid, 'Connect me to your CEO right now! This is unacceptable!', 'Hostile', 'Agent should follow escalation protocol calmly', 45),
  (project_uuid, 'You''re wasting my time on purpose! I know your tricks!', 'Hostile', 'Agent should reassure and expedite genuinely', 46),
  (project_uuid, 'I''m recording this call and sending it to the media!', 'Hostile', 'Agent should remain professional, continue helping', 47),
  (project_uuid, 'Your company is a scam! I want my money back now!', 'Hostile', 'Agent should understand concern, explain refund policy', 48),
  (project_uuid, 'Don''t give me that scripted nonsense! Answer my question properly!', 'Hostile', 'Agent should provide genuine, direct response', 49),
  (project_uuid, 'I''m never using your service again and I''m telling everyone I know!', 'Hostile', 'Agent should attempt to retain customer while respecting decision', 50);

  RAISE NOTICE 'Successfully inserted 50 evaluation prompts';
END $$;
