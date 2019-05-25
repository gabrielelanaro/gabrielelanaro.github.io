---
title: VisualNeurons.com, painting videos with S3, Cognito, Lambda, SES and AWS AI
layout: page
tags: machine learning
categories: blog
comments: true
include_js: ["http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"]
---
![](https://paper-attachments.dropbox.com/s_6917395D26A510D8B05CF2BD20B7A316901BF448B296BF7666D392AE03BA6E28_1557231608523_FeaturedImageVideo.png)


**A quick disclaimer**: [visualneurons.com](http://visualneurons.com/), together with this post, is a 2-man work, adding up the efforts of [Francesco Pochetti](https://francescopochetti.com/) and [Gabriele Lanaro](https://gabrielelanaro.github.io/). The code is available [here on Github](https://github.com/gabrielelanaro/ml-prototypes/tree/master/prototypes/styletransfer).

## Table of Contents
1. Running Neural Style Transfer on videos
2. The Deep Learning magic
3. Architecting on AWS
    1. The bird-eye view
    2. The frontend: uploading to S3 with Cognito
    3. The backend: Lambda, SES and EC2
# Running Neural Style Transfer on videos

Almost a month back, we released [visualneurons.com](http://visualneurons.com/). The original idea was to build a web application allowing users to upload a picture, choose a piece of art, and run the Deep Learning magic. The well-known Neural Style Transfer algorithm runs in the backend, painting the original image with the style of the artwork. Quite neat.

We wanted to go a step further, though. If we can do single images, why can’t we process entire videos? A clip is nothing else than a succession of pictures (frames) stuck together at a sufficiently high rate to give the impression of motion. Of course we can do that.

The purpose of this post is to walk you through the details of the Deep Learning approach we followed, and how we implemented the end-to-end solution on AWS, adding this functionality to the existing web application. 
To keep the processing time under control, we currently allow users to upload GIF files only. GIFs last, on average, less than 10 seconds, which is just the right duration to develop a proof of concept such as ours.

Feel free to check it out at [visualneurons.com](http://visualneurons.com/). If you can’t wait, take a look at the below demo on a GIF. The end result is pretty cool!


![](https://paper-attachments.dropbox.com/s_6917395D26A510D8B05CF2BD20B7A316901BF448B296BF7666D392AE03BA6E28_1558714429201_iron_man_dual.gif)



# The Deep Learning magic

Our starting point was the original algorithm for neural style transfer by [Gatys et al (2015)](https://arxiv.org/abs/1508.06576) based on optimizing an image to match the content and style of another image by manipulating some clever losses. If you are not familiar with the procedure, I recommend you to check out this excellent [post](https://francescopochetti.com/style-transfer-with-fast-ai-and-pytorch/) about style transfer!

In summary, the general idea is:

- Take an image for style (`style_img`)
- Take an image for content (`content_img`)
- Take a pretrained neural net
- Create an “output” image where each pixel is a parameter to optimize
- Optimize the “output” image so that the content loss and style loss are minimized 

The first thing we tried was applying the above procedure naively for each frame. This was a quick experiment and provided a good baseline for further experimentation. You can see the result in the GIF below.


![](https://paper-attachments.dropbox.com/s_E5EDDFF9960E09ACED2BB5B6CA06B6497B59C161C88F617A9268F319EAD9AB68_1558751312232_IronManVanGoghCut.gif)


As you can see from the picture, the image is affected by quite a bit of background noise, a lot of details are lost and it takes an awful lot of time to process the image (about 2 hours).
 
Since we were targeting small videos of about 10 seconds, we didn’t try to optimize for time, if we managed to improve the quality.

By doing research there were some options. The obvious one was to implement one of the more recent developments in terms of real-time style transfer where you teach another network (a style transfer network) to transfer the style of a *single* style image to any content image.  However we wanted to fit different styles and we didn’t have time to train a network for each one of our styles (the tradeoff was a higher processing time), plus we expected that improving the speed alone was not sufficient - we needed more quality.  

Other potential improvements (inspired by [Ruder et al 2016](https://arxiv.org/abs/1604.08610)) were:

- Initialize the the optimizer (Adam) state once and maintain it between frames 
- Initialize the current frame with the previous frame
- Add a “temporal consistency loss” that tries to match one or more of the previous frames

Unfortunately, even after implementing these improvements we still had quality problems. At this point, we decided to focus more on single-image quality. There were a couple of things we didn’t try:

- we didn’t experiment very much with the choice of inner layers
- we didn’t attempt to reduce noise in general

Thankfully a lot of people experimented with style transfer and we borrowed the ideas explained [in this post](https://towardsdatascience.com/style-transfer-styling-images-with-convolutional-neural-networks-7d215b58f461) and applied them to our problem. The first big improvement was given by setting our style and content layers as follows:


    style_layers = ["block1_conv2", 
                    "block2_conv2", 
                    "block3_conv3", 
                    "block4_conv3", 
                    "block5_conv3"]
    
    content_layers = ["block2_conv2"]

This gave quite excellent results already, but we went ahead and also implemented an additional term that is useful to suppress a lot of noise in the background. This is called total_variation loss, which is conveniently implemented as follow, where `image` will be the image we are trying to optimize.

        def _total_variation_loss(self, image: tf.Variable):
            return tf.reduce_mean(tf.image.total_variation(image))

But what is this total variation loss exactly?

The idea is that we want the variation between adjacent pixels to be small, so we calculate the absolute difference of the pixel values between every neighboring pixel. In pseudo-code, it would look something like this (`tv` is the loss and `img` is the image):

    tv = 0
    for i in range(width):
       for j in range(height):
           # Sum the loss for every neighboring pixel
           tv += abs(img[i, j] - img[i + 1, j]) + abs(img[i, j] - img[i, j+1])
    tv = tv / (width * height) # Take the average

This brought us very close to an acceptable quality target for our demo, like the video below!

![](https://paper-attachments.dropbox.com/s_E5EDDFF9960E09ACED2BB5B6CA06B6497B59C161C88F617A9268F319EAD9AB68_1558751700295_iron_man_vg_post_styled.gif)


As it’s common in research there is still plenty of room for improvement (that’s the fun part!), such as implementing better initialization and temporal losses, or bite the bullet and train a full-fledged real-time style transfer on the lines of [Gao et al 2018](https://arxiv.org/abs/1807.01197).

# Architecting on AWS

Now that you know what we achieved and what is the science behind it, let’s focus on how we got there. This section is a deep dive into the technical implementation of our Style Transfer video feature. How we integrated it with the existing web application, the AWS services we used and how everything fits together delivering a seamless user experience. 

## The bird-eye view

Here a diagram of the AWS infrastructure we deployed in production.

![](https://paper-attachments.dropbox.com/s_6917395D26A510D8B05CF2BD20B7A316901BF448B296BF7666D392AE03BA6E28_1557237439835_AWS_architecture_video.png)


Everything starts with users landing the [visualneurons.com](http://visualneurons.com/) home page. We now give digital artists the possibility to choose between styling a single image or a whole GIF clip. The first option redirects to the web app extensively described [here](https://francescopochetti.com/visualneurons-com-running-neural-style-transfer-on-aws/) already. 
The video option builds on top of Image Style Transfer, generating a completely different product.
Going back to the AWS diagram, the workflow looks as follows:

1. Users upload a GIF file to S3. [Amazon Cognito](https://aws.amazon.com/cognito/) is in charge of providing them with temporary access to our private buckets. In the frontend, the AWS Javascript SDK allows to add  `style_image` and `user_email` as metadata to the S3 new object. Those variables are of key importance for what happens next.
2. The S3 `putObject` event triggers a Lambda function.
3. Lambda does two things:
    1. sends a [SES](https://aws.amazon.com/ses/) email to users, notifying them that the GIF has been successfully uploaded to S3 and that the Style Transfer process is warming up.
    2. spins up a GPU-powered EC2 instance (p2.xlarge), sets up the Tensorflow environment and kicks-off the optimization process.
4. When done with the Deep Learning magic, the EC2 instance saves the newly styled GIF to S3 …
5. … and sends the link over to the user via a second SES email.


## The frontend: uploading to S3 with Cognito

We won’t dive deep into how the frontend works again. We did it already [here](https://francescopochetti.com/visualneurons-com-running-neural-style-transfer-on-aws/) and [here](https://francescopochetti.com/is-this-movie-a-thrillerinvoking-a-sagemaker-deep-learning-model-in-an-end-to-end-serverless-web-application/) in the relevant sections. Just as a refresher, our static website is hosted on an S3 bucket, with Amazon Route 53 resolving the [public domain](http://visualneurons.com/) and pointing to it. 

The most interesting challenge we had to solve this time consisted in allowing users to upload GIF files to our private S3 buckets. That’s a problem we did not have when processing standalone images. Everything relied on WebSockets in that case, with browser and EC2 ping-ponging pictures to each other. Nothing was ever saved to disk. This is not a viable approach for videos, evidently. They are just too big to be processed on the fly and the first step is to safely store them somewhere for easy access later on. Now, here the issue. How do you let users upload an object to an S3 bucket they don’t have access to? They would need AWS credentials for that. We cannot really expose those in plain text in the frontend, though. So, how do we do it? 
Meet [Amazon Cognito](https://aws.amazon.com/cognito/). This service, together with the Javascript SDK makes the entire process a piece of cake. The idea is to create [Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/identity-pools.html). Those are Cognito entities whose purpose is to provide temporary access to specific AWS resources to all kinds of users. [This](https://medium.com/@haydnjmorris/uploading-photos-to-aws-s3-getting-started-with-cognito-and-iam-c96ba5b5496d) post does a fantastic job at introducing the service setup, so I won’t reinvent the wheel. The only missing part is how to integrate all the components in the frontend. For that, you can refer to our `[videos.js](https://github.com/gabrielelanaro/ml-prototypes/blob/master/prototypes/styletransfer/website/videos.js)`. The key lines of code are the following:


    //***************************************
    // lines 1-20
    //***************************************
    
    AWS.config.region = 'eu-west-1'; // Region
    
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'your identity pool id',
    });
    
    var bucketName = 'your bucket'; // Enter your bucket name
    var bucket = new AWS.S3({
        params: {
            Bucket: bucketName
        }
    });
    
    //***************************************
    // lines 33-89
    //***************************************
    
    var objKey = clean_email + '_' + file.name;
    var params = {
        Key: objKey,
        ContentType: file.type,
        Body: file,
        Metadata: {
            'email': email,
            'style': document.getElementById("style_choice").value,
        },
    };
    bucket.putObject(params, function(err, data) {
        if (err) {
            results.textContent = 'ERROR: ' + err;
        } else {
            results.textContent = "GIF ingested successfully!";
        }
    });

As you can see, within Javascript, we add two pieces of information to the S3 object `Metadata`: `email` and `style`. The first is the user’s email address, which the customer introduces in the web page. We need it to send SES notifications along the way: the first to confirm the file has been correctly ingested, the second containing the S3 link to the style-transferred GIF at the end of the process. `style` is the artwork the user selects, and it is obviously needed to perform the actual Deep Learning optimization. Adding this info as `Metadata` allows us to pass just the object name to the EC2 in charge of the computations, down the line. Accessing the object means accessing user’s email and style image.

## The backend: Lambda, SES and EC2

As soon as the user uploads a GIF a couple of things happen.

The S3 `putObject` event triggers a Lambda function which spins up a GPU-powered `p2.xlarge` EC2 instance. 
Lambda takes care of selecting the appropriate [Deep Learning AMI](https://aws.amazon.com/marketplace/pp/B077GCH38C#pdp-support), setting up the Tensorflow environment, and kicking off the python script in charge of Neural Style Transfer. Recall that **Lambda needs permissions to spin up an EC2 instance properly**. Make sure to read the note we add below on this, as it gets soon quite tricky.

Along the way we need to access S3 to retrieve the GIF file and the style image, run the optimization process, save the output GIF to S3 again, and send the file link to the user via a SES email notification. Given that EC2 needs to access other AWS resources, namely S3 and SES, recall to attach to the instance an IAM Role with appropriate permissions.  

Actually, Lambda doesn’t wait for EC2 to do everything we just mentioned. It just needs the `boto3` client to return the instance ID. If this operation succeeds, which means the machine is up and running, Lambda sends a SES notification email to the user, letting him know that the GIF file has been correctly ingested and that the optimization is about to start. If `boto3` fails to spin up EC2, most likely because we have reached our maximum capacity of 10 `p2.xlarge`s running at the same time, Lambda informs the user via email that the request cannot be processed, and to try later. 

**A note on giving Lambda** [**IAM permissions**](https://aws.amazon.com/blogs/security/granting-permission-to-launch-ec2-instances-with-iam-roles-passrole-permission/) **to launch EC2**
In the first iteration of the project we did not really think through the set of permissions Lambda needed to run the intended pipeline. It was obvious it had to access EC2, S3 and SES. Was that all? Nope.

The issue we had not considered comes from running the `boto3` EC2 client `run_instances` command, from within Lambda, with the following argument


    IamInstanceProfile={"Name": "the IAM role to grant EC2 (the one spun up by Lambda) access to S3 and SES"}

This means we stumbled upon [this](https://serverfault.com/questions/545546/how-to-specify-an-iam-role-for-an-amazon-ec2-instance-being-launched-via-the-aws) problem. To solve it, you need to add to the IAM Role controlling Lambda’s permissions, certain IAM privileges. E.g. for Lambda to run the `IamInstanceProfile` argument, it needs to be able to access specific IAM Roles. `PassRole` permissions will do the job. This is quite critical. Don’t forget it.  

**A note on Amazon** [**Simple Email Service**](https://aws.amazon.com/ses/) **(SES)**
As the AWS documentation puts it


> Amazon Simple Email Service (Amazon SES) is a cloud-based email sending service designed to help digital marketers and application developers send marketing, notification, and transactional emails. It is a reliable, cost-effective service for businesses of all sizes that use email to keep in contact with their customers. You can use our SMTP interface or one of the AWS SDKs to integrate Amazon SES directly into your existing applications. You can also integrate the email sending capabilities of Amazon SES into the software you already use, such as ticketing systems and email clients.   

This sounds really beautiful. Something the AWS folks are not mentioning here, though, is the fact that upon activating SES you cannot really start sending emails to anybody you’d like, as you probably thought was the whole point of this service. You will actually be able to notify only previously verified addresses, i.e. people who actually consented to receive your emails. This is because you are in a so-called sandbox. To get out of it and be granted access to the entirety of SES, you need to open a ticket to AWS CS. Everything is explained [here](https://docs.aws.amazon.com/ses/latest/DeveloperGuide/request-production-access.html). 

That’s it. Happy GIF painting on [visualneurons.com](http://visualneurons.com/)!
