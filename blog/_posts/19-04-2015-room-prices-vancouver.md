---
title: Vancouver Room Prices
redirect_from: /blog/2015/03/25/room-prices-vancouver.html
layout: page
categories: blog
tags: python
include_js: ["https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.2/underscore-min.js", "http://d3js.org/d3.v3.min.js", "http://d3js.org/topojson.v1.min.js", "http://d3js.org/queue.v1.min.js", "http://d3js.org/colorbrewer.v1.min.js", "/public/post_resources/room_prices_vancouver/plots.js"]
include_css: ["/public/post_resources/room_prices_vancouver/plots.css"]
comments: true
---

Have you ever wondered what is a good price for a room in Vancouver?

As part of a data project I've been collecting data and analyzing the room rental market
in Vancouver. Having moved several times in the past few years I thought that
would be an interesting topic.

This post is a easy to read **summary** for everyone to read. I'll leave
the discussion of the methodology and a more advanced analysis in a set of future posts
for the interested, nerdy reader.

# The data

Data was collected from a popular website for room listings at approximately 1000 posts/day,
collected every night at 11:30. The information extracted includes price, geographical coordinates, title, content
and other attributes of each post.

**In the current post we examine data collected from March 31st to April 15th**

# Average room prices by neighbourhood

As you may expect, the neighbourhood significantly correlates with price.
The following map shows the average post price by neighbourhood, greener areas
are higher prices.

So far **Downtown** wins as the neighbourhood with the higher average price per listing,
followed closely by **Fairview**. The west is generally on the expensive side, while
the east is quite a bit cheaper.

<div id="numbyneigh" class='plot'>
<script>
  $(document).ready( function () { numByNeigh();} );
</script>
</div>

Keep in mind that the numbers are just **average** prices. This doesn't mean that a
room in Downtown will generally cost more than an *equivalent* room in Victoria-Fraserview.
For example, it may just be that Downtown prices are higher because most of the listings
are luxurious apartments while Victoria-Fraserview is a suburban area where you rent
basements and other humble rooms.

# What do people say and what do people charge

By analyzing the title and the content of each posting, it is possible to determine
how the presence of certain words (what they say) correlates with price (what they charge).

In the following chart you can see that when the post contains **homestay**,
the price is an average extra ~$110 while **basements** are a bit less (~$30)
than the average.

Interestingly, if the word **female** pops up, the price is also slightly lower,
good for you girls!

<div id="popularKeywords" class='center plot' style='max-width: 800px;'>
<script>
  $(document).ready( function () { popularKeywords(); });
</script>
</div>

You can also notice an issue in the model: the **sublet** keyword correlates with a higher price,
contrary to what is commonly observed. This is very likely a drawback of the
methodology (i.e. this is not a *randomized experiment*). One reason for this correlation
could be, for example, that sublets are usually better rooms with a higher
baseline price.

# How long does a post stay up?

According to the data, about 2/3 of the posts are gone within 2-3 days,
after that they follow a steady decline.
Nevertheless, posts don't hang around for too long, so write to a lot of people
and quickly.

<div id="postFrequency" class='center plot' style='max-width: 800px;'>
<script>
$(document).ready( function () { postFrequency(); } );
</script>
</div>


I hope you liked the insights, please write any comments/sugestions or, or if you
wish, ask questions.
