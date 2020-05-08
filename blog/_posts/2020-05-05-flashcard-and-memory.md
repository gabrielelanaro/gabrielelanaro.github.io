---
title: Researching a machine learning based spaced repetition system (flashcards)
layout: page
tags: machine learning
categories: blog
comments: true
include_js: ["http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"]
---

![flashcard]({{site.baseurl}}/public/post_resources/flashcards/flashcard_cover.webp)


For the past year or so I've been trying to learn German, and the most difficult part in language learning is certainly vocabulary learning. The existing apps do a pretty good job at helping with vocabulary learning, with the only issue that creating the flashcards is a big time sink. Initially the idea was to have a pool of words one wants to learn, and then the app would just quiz the user and try to maximize the learning of the user. 

Two main factors are (at least anecdotally) important for learning:

1. **Context**: When learning new vocabulary, it is very useful to learn words in context, for example pictures and related words. If we could group related words and pictures together, the learning would (ideally) be more efficient.

2. **Spaced repetition**: memorizing is more efficient by scheduling card reviews. The famous app Anki does this by asking the user to rate the quality of its memory and scheduling review at longer and longer time intervals.

One of the issue with Anki is that the spaced repetition intervals are not entirely customizable and are fixed to a particular schedule. I thought it would be interesting to research a way to make the spaced repetition system learn and adapt to the user, automatically from data. 

The beauty of this problem is that we are trying to build a system capable of collecting data while helping the user improving its foreign language knowledge. It is quite a refreshing break from standard supervised learning where data needs to be annotated separately!

In this post series I will try to address this problem and share my findings!

## Modeling memory

How can we design a spaced repetition system? First of all let's model the memory of the user. Say we have a flashcard previously unknown. We study it, and at least while it's in front of us we should be able to recall it correctly (just by reading it). If we hide the card, we can expect a few moments later to forget its content.

How fast do we forget it? A popular model is based on a negative exponential function (the model is commonly referred as [Forgetting curve](https://en.wikipedia.org/wiki/Forgetting_curve)) 

$$
R = e^{-\frac{t}{S}}
$$

where:
 - **R** is the "retrievability", how easy is to recall the fact
 - **S** is the stability of the memory, or how strong is the memory for that fact
 - **t** is time since the last recall

To be able to model this thing probabilistically, I will take the license to interpret **R** as the probability of a correct recall.

$$
p(r=1) = e^{-\frac{t}{S}}
$$

where $$p(r=1)$$ just means the probability that if we test the user at time t, the user will recall the fact correctly.

Nice! We have a model for the user memory, which essentially involves a single parameter, **S**, that tells us how well do we know a certain fact. Memorizing something, simply means having a high probability to recall a certain fact.

## Estimating S from data

Could we simply fit the exponential curve to a bunch of data points and find **S**? 

This could perhaps be achieved by using the following procedure (I'm sure some researcher has done something along these lines on real people):

- we take **n** different cards that the subject has never seen and that have the same difficulty
- we show one card to the subject once
- we test at later time if the subject was able to recall the card
- we repeat the same process with other cards so that we can estimate **S**

This is however not how a flashcard app works. Ideally we would like the user to input a bunch of cards of variable difficulty, and start learning right away without having to do any calibration or experiments. Besides, if the user input their own cards of varying difficulty we won't have a reliable estimate of **S** anyway!

We would like the flashcard app to have a feedback loop as follows:

- We have `RepetitionSystem` which chooses which card we should show the user
- We show the card to the user and collect feedback (wether the user recalled the item correctly or not)
- We pass the feedback to the `RepetitionSystem` so that it can learn and decide which card to show next.

```python
repetition_system = RepetitionSystem()

while True:
    card = repetition_system.select_card()
    r = user_input(card)
    repetition_system.feedback(card=card, recalled=r)
```

One of the most pressing issue in trying to estimate **S** is not at constant and depends to a lot of factors. It will, at a bare minimum, depend on our current knowledge of that card.

For example, let's say I want to estimate **S** for the card **i**. If the user never saw that card, then they will forget it at a rate **S**. Now, let's show the same card again to the user, wether the user remembers the card or not, their knowledge would have already improved (because they saw the card twice), which means that **S** has already changed!

![mindblown]({{site.baseurl}}/public/post_resources/flashcards/tim-and-eric-mind-blown.gif)

To complicate things, the user may have already studied the card outside of the repetition system, or the card may be harder/easier to learn than others (try to memorize a number 15 versus the number 131519912).

What can we do to estimate **S** then if it constantly changes? One solution, and the one I will try to explore is to *model* **S** by making certain assumptions and try to estimate the model from data using statistics.


The first model I'd like to explore, is expressing **S** as a sum of contributions. Wether we recall the card correctly or not, our knowledge improves:

```
# S_c and S_w are constrained to be positive numbers
S = S_c * n_correct + S_w * n_wrong
```

Note that we use two parameters **S_c** and **S_w** which represent the how much does the knowledge of that card has improved if we recalled the card correctly or incorrectly.

While this model is certainly unrealistic, I believe it can be useful as a stepping stone before trying to take into account more factors (such as the card difficulty or pre-existing knowledge).

## Building a spaced repetition system

Once we have a good model for the user memory, how can we build a spaced repetition system? This is another quite difficult question. 

Let's assume we have 10 cards that are unknown to the user. The objective of the spaced repetition system is to take the user to a point where he/she is able to comfortably recall all the cards.

What can we do to facilitate this process? The only point of interaction between the system and the user (for the moment) is the choice of which card the system will show to the user.

If we call the "knowledge of all cards" our "reward", we can formulate this problem as:

> estabilish a card-selection strategy so that we maximize our reward.

**What is our card selection strategy?** It is a probability distribution of picking a certain card given our knowledge model (which encapsulate the state of the world)

```
 p(card|knowledge_model)
```

**what is our reward?** This is where things get tricky. Our reward would be that if we were to test the user he would know all the cards! However, since in our spaced repetition system we don't actually test the user over all cards, it's impossible for us to observe it.


## Simplifying things: bandits

While I haven't look very much into the above reinforcement learning formulation because it seems to be quite involved (see [Dragan et al.](https://people.eecs.berkeley.edu/~reddy/files/DRL_Tutor_NIPS17_MT_Workshop.pdf) and [Gomez-Rodriguez](https://www.pnas.org/content/116/10/3988)), maybe we can actually simplify the problem. What if we defined a much easier reward signal?

I thought about defining the problem this way:

We ask the user a particular card:
- if the card was successfully recalled, the reward is the time since the user has last seen the card
- if the card was not successfully recalled, the reward is 0

This means that if the reward is maximized, we are showing the cards that the user is about to forget (the more we wait to show a card, the higher the reward will be, as long as the user is able to remember it. At the same time we would like for the user to be satisfied and experience mostly correct recalls.

This kind of problem can be formulated as a multi-armed bandit. We have **k** choices, and we need to pick the choice that maximizes our reward. 

## Sketching a first system

Now we have all the elements in place to sketch what our system. It may look like this (heavily simplified):

1. We have a  knowledge model based on some sort of regression, which tells us what is the reward that we can expect by picking a certain card. This knowledge model knows about the interaction of the user with each card and is able to estimate the parameters **S_c** and **S_w** that can be used to estimate **S** and therefore the probability of a correct recall

```python
class KnowledgeModel:

    def train(self, data):
        ... magical inference
        return params

    def prob_recall(self, t, features, params):
        S = params.S_c * features.n_correct + params.S_w * features.n_wrong
        return np.exp(-t / S) 
```

2. We have a `RepetitionSystem` that will use the knowledge model to choose which card to pick, based on the estimated reward. Note that the repetition system is responsible to keep track on the user interactions with the system.

```python
class RepetitionSystem:

    def __init__(self, n_cards: int, knowledge_model: KnowledgeModel):
        self._n_cards = n_cards
        self._n_correct = np.zeros(n_cards)
        self._n_wrong = np.zeros(n_cards)
        self._last_seen = np.zeros(n_cards)

        self._knowledge_model = knowledge_model
        self._params = knowledge_model.estimated_params([]) # Prior params

    def select_card(self) -> int:
        expected_reward = []
        for c in range(self._n_cards):

            # Calculate features
            features = Features(n_correct=self._n_correct[c], n_wrong=self._n_wrong)
            t = current_time() - self._last_seen[c]

            p = self._knowledge_model.prob_recall(t, features, self._params)
            expected_reward.append(reward(p, t))
        
        # Select the maximum expected reward
        return np.argmax(expected_reward)

    def feedback(self, card_id: int, recalled: bool) -> None:
        # Update n_correct, n_wrong, last_seen, and dataset
        ...

        # Train the model using the dataset
        self._knowledge_model.train(data)



def reward(p, t):
    # If correct, the reward is p, if wrong, the reward is 0
    # this is the expected reward, i.e. an average weighted by the probability of each possible
    # reward
    return p * t + (1 - p) * 0
```

This is a very simplified overview on how a repetition system may look like, but will it actually work? (Spoiler alert: no). We'll experiments and resolve issue as they arise and play around with this system in future posts of this series!